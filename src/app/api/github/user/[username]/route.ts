import { NextResponse } from "next/server";
import type {
  ContributionWeek,
  ProfileInsights,
} from "@/interfaces/profile-insights";
import { getValidAuthToken } from "@/lib/auth-token";
import { parseProfileBadges } from "@/lib/github-profile-badges";
import { contributionRange, summarizeActivity } from "@/lib/profile-activity";
import {
  collectorVersion,
  readCommitAggregates,
} from "@/lib/scoring/aggregate-planner";
import {
  collectCommits,
  collectDetailPages,
  collectionBudget,
  createCollectionBudget,
  type RateLimit,
  rateLimitFields,
} from "@/lib/scoring/collection-server";
import {
  githubSnapshot,
  type ScoringCollection,
  scoringCollectionFields,
  scoringReviewPageQuery,
} from "@/lib/scoring/github";
import { collaborationInputs } from "@/lib/scoring/github-collaboration";
import { loadScoringHistory } from "@/lib/scoring/github-history-server";
import { discoverMaintainerEvidence } from "@/lib/scoring/maintainer-server";
import { ScoringInputError } from "@/lib/scoring/normalize";
import { aggregateConfig, roleConfig } from "@/lib/scoring/score";
import { scoreProfile } from "@/lib/scoring/server";

type Collection = ScoringCollection & {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
  contributionCalendar: { weeks: ContributionWeek[] };
};

type GithubProfileQuery = {
  data?: {
    rateLimit?: RateLimit;
    viewer?: { login: string };
    user:
      | (Omit<ProfileInsights["user"], "email"> & {
          id: string;
          organizations?: { nodes: { login: string; avatarUrl: string }[] };
          repositories?: {
            totalCount: number;
            nodes: {
              id: string;
              name: string;
              isPrivate: boolean;
              visibility: "PUBLIC" | "PRIVATE" | "INTERNAL";
              stargazerCount: number;
              forkCount: number;
              releases?: {
                totalCount: number;
                nodes?:
                  | ({ isDraft: boolean; publishedAt: string | null } | null)[]
                  | null;
              };
            }[];
          } | null;
          pinnedItems?: {
            nodes:
              | (NonNullable<ProfileInsights["pinnedRepositories"]>[number] & {
                  isPrivate: boolean;
                })[]
              | null;
          } | null;
          contributionsCollection: Collection | null;
        })
      | null;
    profileReadme?: {
      isPrivate: boolean;
      object: { text?: string; isTruncated?: boolean } | null;
    } | null;
  };
  errors?: { type?: string; path?: (string | number)[] }[];
};

const githubGraphQL = (scoreV3: boolean, aggregate: boolean, role: boolean) => `
  query($login: String!, $from: DateTime!, $to: DateTime!${aggregate ? ", $maxRepos: Int!, $pageSize: Int!" : ""}) {
    ${aggregate ? rateLimitFields : ""}
    viewer { login }
    user(login: $login) {
      id name login avatarUrl bio company location websiteUrl createdAt url pronouns
      socialAccounts(first: 6) { nodes { displayName url } }
      organizations(first: 30) { nodes { login avatarUrl } }
      followers { totalCount }
      following { totalCount }
      repositories(ownerAffiliations: [OWNER], isFork: false, ${scoreV3 ? "privacy: PUBLIC," : ""} first: 100, orderBy: { field: STARGAZERS, direction: DESC }) {
        totalCount
        nodes {
          id
          name
          isPrivate visibility
          stargazerCount
          forkCount
          releases(first: 5) { totalCount ${scoreV3 ? "nodes { isDraft publishedAt }" : ""} }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        ${!scoreV3 ? "" : aggregate ? scoringCollectionFields("$maxRepos", "$pageSize", role) : scoringCollectionFields()}
        contributionCalendar {
          weeks { contributionDays { date contributionCount contributionLevel weekday } }
        }
      }
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            nameWithOwner description url isPrivate stargazerCount forkCount
            primaryLanguage { name color }
          }
        }
      }
    }
    profileReadme: repository(owner: $login, name: $login) {
      isPrivate
      object(expression: "HEAD:README.md") {
        ... on Blob { text isTruncated }
      }
    }
  }
`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const login = (await params).username.trim().replace(/^@/, "");
  if (!/^[a-z\d-]{1,39}$/i.test(login)) {
    return NextResponse.json(
      { error: "Tên tài khoản GitHub không hợp lệ." },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();
  if (!token)
    return NextResponse.json(
      { error: "Đăng nhập GitHub để xem Insights." },
      { status: 401 },
    );

  const scoreV3 = process.env.GITVN_SCORING_V3 !== "0";
  const aggregate = scoreV3 && process.env.GITVN_COLLECTOR_VERSION !== "3.0";
  const role = aggregate && process.env.GITVN_SCORING_ROLE !== "0";
  const config = role ? roleConfig : aggregateConfig;
  const ledger = createCollectionBudget(token);
  const now = Date.now();
  const { from, to } = contributionRange(
    new Date(scoreV3 ? Math.floor(now / 30_000) * 30_000 : now),
  );
  const signal = AbortSignal.timeout(9000);
  const publicOrgs = fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}/orgs?per_page=30`,
    {
      headers: { Accept: "application/vnd.github+json" },
      signal,
      cache: "no-store",
    },
  )
    .then(async (res) => {
      if (!res.ok) return [];
      const organizations: ProfileInsights["organizations"] = await res.json();
      return organizations.map(({ login, avatar_url }) => ({
        login,
        avatar_url,
      }));
    })
    .catch(() => []);

  const badgeData = fetch(`https://github.com/${encodeURIComponent(login)}`, {
    headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(1500),
    cache: "no-store",
  })
    .then(async (res) => parseProfileBadges(res.ok ? await res.text() : ""))
    .catch(() => parseProfileBadges(""));

  const publicEmail = fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}`,
    {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    },
  )
    .then(async (res) => {
      if (!res.ok) return null;
      const { email } = await res.json();
      return typeof email === "string" ? email : null;
    })
    .catch(() => null);

  try {
    const primaryStarted = performance.now();
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: githubGraphQL(scoreV3, aggregate, role),
        variables: {
          login,
          from,
          to,
          ...(aggregate && {
            maxRepos: collectionBudget.maxRepos,
            pageSize: collectionBudget.pageSize,
          }),
        },
      }),
      cache: "no-store",
      signal,
    });
    const retry = response.headers.get("retry-after");
    const exhausted = response.headers.get("x-ratelimit-remaining") === "0";
    const body = await response.text();
    const graph: GithubProfileQuery = response.ok ? JSON.parse(body) : {};
    ledger.primary(Buffer.byteLength(body), performance.now() - primaryStarted);
    ledger.observe(response, graph.data?.rateLimit);
    const limited =
      response.status === 429 ||
      (response.status === 403 &&
        (retry || exhausted || /rate limit/i.test(body))) ||
      (!graph.data?.user &&
        graph.errors?.some((entry) => entry.type === "RATE_LIMITED"));
    if (limited) {
      const reset = Number(response.headers.get("x-ratelimit-reset"));
      const delay =
        Number.isFinite(reset) && reset > 0
          ? Math.max(1, Math.ceil(reset - Date.now() / 1000))
          : 60;
      return NextResponse.json(
        { error: "GitHub đang giới hạn số lượt yêu cầu." },
        {
          status: 429,
          headers: {
            "Retry-After":
              retry && /^\d+$/.test(retry)
                ? retry
                : String(exhausted ? delay : 60),
          },
        },
      );
    }
    const userData = graph.data?.user;
    if (!userData) {
      const missing = graph.errors?.some(
        (entry) =>
          entry.type === "NOT_FOUND" &&
          entry.path?.length === 1 &&
          entry.path[0] === "user",
      );
      return NextResponse.json(
        {
          error: missing
            ? "Không tìm thấy tài khoản GitHub."
            : "GitHub chưa trả về dữ liệu hồ sơ.",
        },
        { status: missing ? 404 : 502 },
      );
    }

    const {
      id,
      pinnedItems,
      contributionsCollection: collection,
      organizations: subjectOrgs,
      repositories: userRepositories,
      ...user
    } = userData;

    const firstReviews = collection?.pullRequestReviewContributions;
    const after = firstReviews?.pageInfo?.endCursor;
    const reviewPage = (async () => {
      if (
        scoreV3 &&
        !aggregate &&
        collection &&
        firstReviews?.nodes &&
        firstReviews.pageInfo.hasNextPage &&
        after &&
        !retry &&
        !exhausted
      ) {
        try {
          const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: scoringReviewPageQuery,
              variables: { login, from, to, after },
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(4000),
          });
          if (response.ok) {
            const page: GithubProfileQuery = await response.json();
            const next =
              page.data?.user?.contributionsCollection
                ?.pullRequestReviewContributions;
            if (
              !page.errors?.length &&
              page.data?.user?.id === id &&
              next?.nodes &&
              next.pageInfo
            ) {
              collection.pullRequestReviewContributions = {
                nodes: [...firstReviews.nodes, ...next.nodes],
                pageInfo: next.pageInfo,
              };
            }
          }
        } catch {
          // Keep the first page and its partial availability if the follow-up fails.
        }
      }
    })();

    const userRepos = userRepositories?.nodes ?? [];
    const publicOwnedRepos = userRepos.filter((r) => r?.isPrivate === false);
    const totalStars = publicOwnedRepos.reduce(
      (sum, r) => sum + (r.stargazerCount || 0),
      0,
    );
    const totalForks = publicOwnedRepos.reduce(
      (sum, r) => sum + (r.forkCount || 0),
      0,
    );
    const totalReleases = publicOwnedRepos.reduce(
      (sum, r) => sum + (r.releases?.totalCount || 0),
      0,
    );

    const through = to.slice(0, 10);
    const start = from.slice(0, 10);
    const weeks =
      collection?.contributionCalendar?.weeks
        ?.map((week) => ({
          contributionDays: week.contributionDays.filter(
            (day) => day.date >= start && day.date <= through,
          ),
        }))
        .filter((week) => week.contributionDays.length > 0) ?? [];
    const blob = graph.data?.profileReadme;
    const isOwnProfile =
      graph.data?.viewer?.login.toLowerCase() === user.login.toLowerCase();
    const ownMemberships = isOwnProfile
      ? fetch(
          "https://api.github.com/user/memberships/orgs?state=active&per_page=100",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(4000),
          },
        )
          .then(async (response) => {
            if (!response.ok) return [];
            const items: {
              organization: ProfileInsights["organizations"][number];
            }[] = await response.json();
            return items.map(({ organization }) => organization);
          })
          .catch(() => [])
      : [];
    let score: ProfileInsights["score"];
    if (scoreV3) {
      const evaluatedAt = Date.parse(to);
      const followers = user.followers?.totalCount;
      try {
        const partial = Boolean(
          graph.errors?.some(
            (error) => error.path?.[0] === "user" || !error.path,
          ),
        );
        if (aggregate) {
          const started = performance.now();
          const initialNetworkMs = ledger.diagnostics.networkMs;
          const window = { from: Date.parse(from), to: evaluatedAt };
          const initial = readCommitAggregates(
            collection ?? undefined,
            window,
            partial,
          );
          const snapshotFor = (
            commits: typeof initial,
            data: ScoringCollection | null = collection,
          ) => {
            const snapshot = githubSnapshot(
              id,
              evaluatedAt,
              followers,
              userRepositories,
              data,
              partial,
              undefined,
              commits,
            );
            return role ? collaborationInputs(snapshot, data) : snapshot;
          };
          let detail: ScoringCollection | null = collection;
          if (detail) {
            const observed = scoreProfile(snapshotFor(initial), token, config);
            const unresolved = new Set(observed.completeness.missingMetrics);
            const targets = (
              [
                "pullRequestContributions",
                "issueContributions",
                "pullRequestReviewContributions",
              ] as const
            ).filter((key) => {
              const relevant =
                key === "pullRequestContributions"
                  ? ([
                      "pulls",
                      "merged",
                      "reviewed",
                      "contributorMerges",
                      "contributorReviews",
                      "qualified",
                      "sustained",
                      "external",
                    ] as const)
                  : key === "issueContributions"
                    ? (["issues", "linkedIssues", "sustained"] as const)
                    : ([
                        "reviews",
                        "otherReviews",
                        "reviewPrs",
                        "reviewAuthors",
                        "maintainerMerges",
                        "maintainerAuthors",
                        "sustained",
                      ] as const);
              return relevant.some((metric) => unresolved.has(metric));
            });
            detail = await collectDetailPages(
              ledger,
              detail,
              id,
              login,
              from,
              to,
              targets,
              role,
            );
          }
          const commits =
            process.env.GITVN_COLLECTION_ADAPTIVE === "0"
              ? initial
              : await collectCommits(
                  ledger,
                  token,
                  id,
                  login,
                  window,
                  initial,
                  (observed) => {
                    const result = scoreProfile(
                      snapshotFor(observed, detail),
                      token,
                      config,
                    );
                    return result.completeness.missingMetrics.some((metric) =>
                      [
                        "commits",
                        "qualified",
                        "sustained",
                        "external",
                      ].includes(metric),
                    );
                  },
                );
          const snapshot = snapshotFor(commits, detail);
          let staleRole = false;
          if (role) {
            const current = scoreProfile(snapshot, token, config).collaboration;
            ledger.diagnostics.maintainerMergesBeforeSearch =
              current?.maintainer.metrics[0].raw ?? 0;
            const needMaintainer = Boolean(
              current?.missing.some(
                (metric) =>
                  metric === "maintainerMerges" ||
                  metric === "maintainerAuthors",
              ),
            );
            const needIssues =
              current?.missing.includes("resolvedIssues") ?? false;
            const search = await discoverMaintainerEvidence(
              ledger,
              detail,
              token,
              id,
              login,
              from,
              to,
              needMaintainer,
              needIssues,
            );
            if (search) {
              const publicRepos = new Set(
                snapshot.repositories
                  .filter((repo) => repo.visibility === "public")
                  .map((repo) => repo.id),
              );
              collaborationInputs(
                snapshot,
                detail,
                search.stale
                  ? {
                      ...search,
                      pulls: search.pulls.filter((pull) =>
                        publicRepos.has(pull.repository.id),
                      ),
                    }
                  : search,
              );
              staleRole = Boolean(search.stale);
              if (search.truncated)
                snapshot.limitations?.push(
                  "Kết quả tìm PR chỉ bao phủ một phần hoạt động hợp nhất.",
                );
            }
            if (snapshot.collaboration)
              snapshot.limitations?.push(
                "GitHub chưa cung cấp danh sách đầy đủ PR được một tài khoản hợp nhất.",
              );
          }
          ledger.diagnostics.planningMs =
            performance.now() -
            started -
            Math.max(0, ledger.diagnostics.networkMs - initialNetworkMs);
          ledger.diagnostics.aggregateBuckets = commits.buckets.length;
          const timing = { normalizationMs: 0, scoringMs: 0 };
          score = scoreProfile(snapshot, token, config, timing);
          Object.assign(ledger.diagnostics, timing);
          score = {
            ...score,
            collection: {
              version: collectorVersion,
              restricted: commits.restricted,
              status:
                ledger.diagnostics.cache === "stale" || staleRole
                  ? "stale"
                  : score.completeness.status === "insufficient"
                    ? "unavailable"
                    : score.provisional ||
                        score.categories.some((category) =>
                          category.metrics.some(
                            (metric) => metric.availability !== "complete",
                          ),
                        )
                      ? "partial"
                      : commits.restricted
                        ? "restricted"
                        : "complete",
            },
          };
        } else {
          const initialSnapshot = githubSnapshot(
            id,
            evaluatedAt,
            followers,
            userRepositories,
            collection,
            partial,
          );
          const history = await loadScoringHistory(
            initialSnapshot,
            token,
            from,
            to,
            !retry && !exhausted,
          );
          await reviewPage;
          const snapshot =
            history ||
            firstReviews !== collection?.pullRequestReviewContributions
              ? githubSnapshot(
                  id,
                  evaluatedAt,
                  followers,
                  userRepositories,
                  collection,
                  partial,
                  history,
                )
              : initialSnapshot;
          score = scoreProfile(snapshot, token);
        }
      } catch (error) {
        if (!(error instanceof ScoringInputError)) throw error;
        const fallback = githubSnapshot(
          id,
          evaluatedAt,
          followers,
          userRepositories,
          null,
          true,
        );
        fallback.limitations?.push(
          "Một số dữ liệu hoạt động GitHub không đúng định dạng.",
        );
        score = scoreProfile(fallback, token, aggregate ? config : undefined);
      }
    }

    const [publicOrganizations, email, badges, memberships] = await Promise.all(
      [publicOrgs, publicEmail, badgeData, ownMemberships],
    );
    const organizations = new Map(
      publicOrganizations.map((org) => [org.login.toLowerCase(), org]),
    );
    if (isOwnProfile) {
      for (const org of memberships) {
        organizations.set(org.login.toLowerCase(), org);
      }
      for (const org of subjectOrgs?.nodes ?? []) {
        organizations.set(org.login.toLowerCase(), {
          login: org.login,
          avatar_url: org.avatarUrl,
        });
      }
    }

    if (aggregate && process.env.GITVN_COLLECTION_DIAGNOSTICS === "1") {
      process.stdout.write(
        `${JSON.stringify({
          event: "gitvn-collection",
          collector: collectorVersion,
          scoringVersion: config.version,
          verifiedMaintainerMerges:
            score?.collaboration?.maintainer.metrics[0].raw ?? null,
          ...ledger.finish(),
          restRequests: isOwnProfile ? 3 : 2,
          badgeRequests: 1,
          unresolvedMetrics: score?.completeness.missingMetrics.length ?? null,
          scoreResolvedMetrics:
            score &&
            [
              ...score.categories.flatMap((category) => category.metrics),
              ...(score.collaboration
                ? [
                    score.collaboration.review,
                    score.collaboration.contributor,
                    score.collaboration.maintainer,
                    score.collaboration.issues,
                  ].flatMap((item) => item.metrics)
                : []),
            ].filter(
              (metric) =>
                metric.scoreResolved && metric.availability !== "complete",
            ).length,
        })}\n`,
      );
    }

    const payload: ProfileInsights = {
      ...badges,
      score,
      isOwnProfile,
      user: { ...user, email },
      activity:
        collection && weeks.length
          ? {
              from: start,
              through,
              weeks,
              ...summarizeActivity(weeks, through),
              activeRepositories:
                collection.totalRepositoriesWithContributedCommits,
              commits: collection.totalCommitContributions,
              pulls: collection.totalPullRequestContributions,
              issues: collection.totalIssueContributions,
              reviews: collection.totalPullRequestReviewContributions,
              stars: totalStars,
              releases: totalReleases,
              forks: totalForks,
            }
          : null,
      pinnedRepositories:
        pinnedItems?.nodes?.flatMap((node) =>
          node?.isPrivate === false ? [node] : [],
        ) ?? null,
      organizations: Array.from(organizations.values()),
      codeChanges: null,
      readme:
        blob?.isPrivate === false && !blob.object?.isTruncated
          ? (blob.object?.text ?? null)
          : null,
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối GitHub để tải Insights." },
      { status: 502 },
    );
  }
}
