import { NextResponse } from "next/server";
import type {
  ContributionWeek,
  ProfileInsights,
} from "@/interfaces/profile-insights";
import { getValidAuthToken } from "@/lib/auth-token";
import { parseProfileBadges } from "@/lib/github-profile-badges";
import { contributionRange, summarizeActivity } from "@/lib/profile-activity";

type Collection = {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
  commitContributionsByRepository: {
    repository: { id: string; isPrivate: boolean };
  }[];
  contributionCalendar: { weeks: ContributionWeek[] };
};

type GithubProfileQuery = {
  data?: {
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
              stargazerCount: number;
              forkCount: number;
              releases?: { totalCount: number };
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
  errors?: { type?: string }[];
};

const githubGraphQL = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    viewer { login }
    user(login: $login) {
      id name login avatarUrl bio company location websiteUrl createdAt url pronouns
      socialAccounts(first: 6) { nodes { displayName url } }
      organizations(first: 30) { nodes { login avatarUrl } }
      followers { totalCount }
      following { totalCount }
      repositories(ownerAffiliations: [OWNER], isFork: false, first: 100, orderBy: { field: STARGAZERS, direction: DESC }) {
        totalCount
        nodes {
          id
          name
          isPrivate
          stargazerCount
          forkCount
          releases { totalCount }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        commitContributionsByRepository(maxRepositories: 12) {
          repository { id isPrivate }
        }
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

  const { from, to } = contributionRange(new Date());
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
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: githubGraphQL,
        variables: { login, from, to },
      }),
      cache: "no-store",
      signal,
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "GitHub chưa trả về dữ liệu hồ sơ." },
        { status: 502 },
      );
    }
    const graph: GithubProfileQuery = await response.json();
    const userData = graph.data?.user;
    if (!userData) {
      const missing = graph.errors?.some((entry) => entry.type === "NOT_FOUND");
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

    const userRepos = userRepositories?.nodes ?? [];
    const publicOwnedRepos = userRepos.filter((r) => !r.isPrivate);
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
      collection?.contributionCalendar.weeks
        .map((week) => ({
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

    const payload: ProfileInsights = {
      ...badges,
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
