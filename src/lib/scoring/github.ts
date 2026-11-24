import type { ContributionWeek } from "../../interfaces/profile-insights";
import type { CommitAggregateResult } from "./aggregate-planner";
import { mergeFields, type RolePull } from "./github-collaboration";
import { reconcileCommitHistory } from "./github-commits";
import type {
  ActivityEvent,
  Availability,
  Kind,
  RawActivitySnapshot,
  Repository,
} from "./models";
import { count, DAY, utcDay } from "./normalize";

type Page<T> = {
  totalCount?: number;
  nodes: (T | null)[] | null;
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
};
type Actor = { __typename: string; id?: string };
export type ContributionRepository = {
  nameWithOwner?: string;
  isPrivate?: boolean;
  id: string;
  visibility: "PUBLIC" | "PRIVATE" | "INTERNAL";
  owner: { id: string; login?: string };
  isFork: boolean;
  isArchived: boolean;
};
type Repo = ContributionRepository;
type Entry = { occurredAt: string; isRestricted: boolean };
type Review = {
  author: Actor | null;
  submittedAt: string | null;
  state: string;
};
type Closure = {
  createdAt: string;
  closer: {
    __typename: string;
    id?: string;
    state?: string;
    author?: Actor | null;
    repository?: { visibility: Repo["visibility"] };
  } | null;
};
type Issue = {
  id: string;
  author: Actor | null;
  repository: Repo;
  state: string;
  closedAt: string | null;
  timelineItems: { nodes: (Closure | null)[] | null } | null;
};
type Pull = {
  id: string;
  repository: Repo;
  mergedAt: string | null;
  changedFiles: number;
  author: Actor | null;
  state: ActivityEvent["state"];
  mergedBy: Actor | null;
  reviews: Page<Review> | null;
};

export type ScoringCollection = {
  startedAt?: string;
  endedAt?: string;
  contributionCalendar?: { weeks: ContributionWeek[] };
  totalIssueContributions?: number;
  totalPullRequestContributions?: number;
  totalPullRequestReviewContributions?: number;
  totalRepositoryContributions?: number;
  totalRepositoriesWithContributedIssues?: number;
  totalRepositoriesWithContributedPullRequests?: number;
  totalRepositoriesWithContributedPullRequestReviews?: number;
  restrictedContributionsCount?: number;
  commitContributionsByRepository?: {
    repository: Repo;
    contributions: Page<{
      occurredAt: string;
      commitCount: number;
      isRestricted?: boolean;
    }> | null;
  }[];
  totalRepositoriesWithContributedCommits?: number;
  totalCommitContributions?: number;
  pullRequestContributions?: Page<Entry & { pullRequest: Pull }>;
  issueContributions?: Page<Entry & { issue: Issue }>;
  pullRequestReviewContributions?: Page<
    Entry & {
      pullRequest: {
        id: string;
        author: Actor | null;
        repository: Repo;
      } & Pick<RolePull, "merged" | "mergedAt" | "mergedBy">;
      pullRequestReview: Review & { id: string };
    }
  >;
};

type ImpactRepository = {
  id: string;
  isPrivate: boolean;
  visibility: Repo["visibility"];
  stargazerCount: number;
  forkCount: number;
  releases?: {
    totalCount: number;
    nodes?: ({ isDraft: boolean; publishedAt: string | null } | null)[] | null;
  };
};

type Impact = {
  totalCount: number;
  nodes: (ImpactRepository | null)[] | null;
};

export const scoringRepositoryFields =
  "id visibility owner { id } isFork isArchived";
const actorFields = "__typename ... on User { id }";
const contributionFields = "occurredAt isRestricted";
const repository = `repository { ${scoringRepositoryFields} }`;
const pageFields = "pageInfo { hasNextPage }";

export const aggregateTotalsFields = `
  startedAt endedAt restrictedContributionsCount totalRepositoryContributions
  totalRepositoriesWithContributedIssues totalRepositoriesWithContributedPullRequests
  totalRepositoriesWithContributedPullRequestReviews
`;

export const commitBucketFields = (maxRepos: string, pageSize: string) => `
  commitContributionsByRepository(maxRepositories: ${maxRepos}) {
    repository { ${scoringRepositoryFields} nameWithOwner isPrivate owner { login } }
    contributions(first: ${pageSize}) {
      totalCount pageInfo { hasNextPage endCursor }
      nodes { occurredAt commitCount isRestricted }
    }
  }
`;

const pullFields = (after = "") => `
  pullRequestContributions(first: 100${after}) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ${contributionFields}
      pullRequest {
        id state mergedAt changedFiles ${repository} author { ${actorFields} }
        mergedBy { ${actorFields} }
        reviews(first: 8) {
          ${pageFields}
          nodes { author { ${actorFields} } submittedAt state }
        }
      }
    }
  }
`;

const issueFields = (after = "") => `
  issueContributions(first: 100${after}) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ${contributionFields}
      issue {
        id state closedAt ${repository} author { ${actorFields} }
        timelineItems(last: 1, itemTypes: [CLOSED_EVENT]) {
          nodes { ... on ClosedEvent {
            createdAt
            closer { __typename ... on PullRequest { id state author { ${actorFields} } repository { visibility } } }
          } }
        }
      }
    }
  }
`;
export const scoringCollectionFields = (
  maxRepos = "50",
  pageSize = "100",
  role = false,
) => `
  ${aggregateTotalsFields}
  ${commitBucketFields(maxRepos, pageSize)}
  ${pullFields()}
  ${issueFields()}
  ${reviewPageFields("", role)}
`;

function reviewPageFields(after = "", role = false) {
  return `pullRequestReviewContributions(first: 100${after}) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ${contributionFields}
      pullRequest { id ${role ? `repository { ${scoringRepositoryFields} nameWithOwner } ${mergeFields}` : repository} author { ${actorFields} } }
      pullRequestReview { id author { ${actorFields} } submittedAt state }
    }
  }`;
}

export const scoringReviewPageQuery = `
  query GitvnReviewPage($login: String!, $from: DateTime!, $to: DateTime!, $after: String!) {
    user(login: $login) {
      id
      contributionsCollection(from: $from, to: $to) {
        ${reviewPageFields(", after: $after")}
      }
    }
  }
`;

export const contributionPageFields = {
  pullRequestContributions: pullFields,
  issueContributions: issueFields,
  pullRequestReviewContributions: reviewPageFields,
};

export function githubSnapshot(
  subject: string,
  evaluatedAt: number,
  followers: unknown,
  impact: Impact | null | undefined,
  collection: ScoringCollection | null,
  partialResponse: boolean,
  commitHistory?: import("./github-commits").CommitHistoryResponse,
  aggregate?: CommitAggregateResult,
): RawActivitySnapshot {
  const repositories = new Map<string, Repository>();
  const snapshot: RawActivitySnapshot = {
    subject,
    evaluatedAt,
    repositories: [],
    events: [],
    coverage: {},
    impact: {},
    limitations: [],
  };
  const coverage = snapshot.coverage;
  const limitations = snapshot.limitations ?? [];
  const totals = snapshot.impact ?? {};
  const from = (utcDay(evaluatedAt) - 364) * DAY;
  if (count(followers)) {
    totals.followers = followers;
    coverage.followers = "complete";
  }
  if (impact?.nodes) {
    const unique = new Map(
      impact.nodes.flatMap((repo) =>
        repo?.id && ["PUBLIC", "PRIVATE", "INTERNAL"].includes(repo.visibility)
          ? [[repo.id, repo]]
          : [],
      ),
    );
    const publicRepos = [...unique.values()].filter(
      (repo) => repo.visibility === "PUBLIC" && repo.isPrivate === false,
    );
    const availability =
      !partialResponse && unique.size === impact.totalCount
        ? "complete"
        : "partial";
    const fields = [
      ["stars", (repo: ImpactRepository) => repo.stargazerCount],
      ["forks", (repo: ImpactRepository) => repo.forkCount],
      [
        "releases",
        (repo: ImpactRepository) => {
          const releases = repo.releases;
          if (releases?.totalCount === 0) return 0;
          if (
            releases?.nodes?.some(
              (release) => release?.isDraft === false && release.publishedAt,
            )
          )
            return 1;
          if (
            releases?.nodes &&
            releases.nodes.length === releases.totalCount &&
            releases.nodes.every((release) => release?.isDraft === true)
          )
            return 0;
        },
      ],
    ] as const;
    for (const [id, read] of fields) {
      const values = publicRepos.map(read).filter(count);
      if (
        values.length ||
        (publicRepos.length === 0 && availability === "complete")
      ) {
        coverage[id] =
          values.length === publicRepos.length ? availability : "partial";
        totals[id] = values.reduce((a, b) => a + b, 0);
      }
    }
    if (availability === "partial")
      limitations.push(
        "Danh sách kho dùng để tính tác động có thể bị cắt ngắn.",
      );
  }
  if (!collection) return snapshot;
  let excludedNonPublic = false;
  const isNonPublic = (repo: Repo | null | undefined) =>
    repo?.visibility === "PRIVATE" || repo?.visibility === "INTERNAL";

  function addRepo(repo: Repo | undefined) {
    if (
      !repo?.id ||
      repo.visibility !== "PUBLIC" ||
      typeof repo.isFork !== "boolean" ||
      typeof repo.isArchived !== "boolean" ||
      !repo.owner?.id
    )
      return false;
    repositories.set(repo.id, {
      id: repo.id,
      visibility: "public",
      owned: repo.owner.id === subject,
      fork: repo.isFork,
      archived: repo.isArchived,
    });
    return true;
  }

  const rows: NonNullable<RawActivitySnapshot["dailyCommits"]> = [];
  let commitDaysComplete = false;
  if (aggregate) {
    for (const repo of aggregate.repositories) addRepo(repo);
    snapshot.dailyCommits = aggregate.buckets;
    commitDaysComplete = aggregate.complete;
    if (aggregate.buckets.length || aggregate.complete)
      coverage.commits = aggregate.complete ? "complete" : "partial";
    limitations.push(
      "Điểm commit dùng số liệu tổng hợp theo ngày của GitHub. GitVN chưa xác minh nội dung hoặc SHA từng commit.",
    );
    if (!aggregate.complete)
      limitations.push("GitHub chưa trả đủ các ngày hoặc kho có commit.");
  } else if (collection.commitContributionsByRepository) {
    let truncated =
      partialResponse ||
      collection.commitContributionsByRepository.length !==
        collection.totalRepositoriesWithContributedCommits;
    for (const group of collection.commitContributionsByRepository) {
      if (isNonPublic(group?.repository)) {
        excludedNonPublic = true;
        continue;
      }
      if (!addRepo(group?.repository) || !group.contributions?.nodes) {
        truncated = true;
        continue;
      }
      truncated ||= group.contributions.pageInfo?.hasNextPage !== false;
      for (const node of group.contributions.nodes) {
        const at = Date.parse(node?.occurredAt ?? "");
        if (
          !Number.isFinite(at) ||
          !count(node?.commitCount) ||
          node.commitCount > 2_147_483_647
        ) {
          truncated = true;
          continue;
        }
        rows.push({
          day: utcDay(at),
          repo: group.repository.id,
          count: node.commitCount,
        });
      }
    }
    snapshot.dailyCommits = rows;
    commitDaysComplete = !truncated;
    if (rows.length || !truncated)
      coverage.commits =
        !truncated && rows.every((row) => row.count === 0)
          ? "complete"
          : "partial";
    if (truncated)
      limitations.push("GitHub chưa trả đủ các ngày hoặc kho có commit.");
  }

  function collect<T extends Entry>(
    kind: Kind,
    page: Page<T> | undefined,
    repoOf: (entry: T) => Repo | undefined,
    read: (
      entry: T,
    ) => Omit<ActivityEvent, "kind" | "at" | "actor" | "repo"> | undefined,
  ) {
    if (!page?.nodes) return;
    let complete = !partialResponse && page.pageInfo?.hasNextPage === false;
    let valid = 0;
    for (const item of page.nodes) {
      const repo = item && repoOf(item);
      if (item?.isRestricted === true || isNonPublic(repo)) {
        excludedNonPublic = true;
        continue;
      }
      const at = Date.parse(item?.occurredAt ?? "");
      const detail = item && read(item);
      if (
        !item ||
        item.isRestricted !== false ||
        !detail?.id ||
        !Number.isFinite(at) ||
        !repo ||
        !addRepo(repo)
      ) {
        complete = false;
        continue;
      }
      valid++;
      snapshot.events.push({
        kind,
        at,
        repo: repo.id,
        actor: subject,
        ...detail,
      });
    }
    if (complete || valid) coverage[kind] = complete ? "complete" : "partial";
    if (!complete)
      limitations.push(
        "Một phần hồ sơ PR, issue hoặc review không có trong phản hồi GitHub.",
      );
  }

  let missingMerge = false;
  let missingProjectEvidence = false;
  let missingReceivedReview = false;
  let missingReviewAuthor = false;
  let missingClosure = false;
  collect(
    "pulls",
    collection.pullRequestContributions,
    (entry) => entry.pullRequest?.repository,
    ({ pullRequest: pull }) => {
      if (!pull?.repository) return;
      const mergedAt = Date.parse(pull.mergedAt ?? "");
      if (
        pull.state === "MERGED" &&
        (!Number.isFinite(mergedAt) ||
          (pull.repository.isFork && !count(pull.changedFiles)))
      )
        missingProjectEvidence = true;
      if (
        pull.state === "MERGED" &&
        (!Number.isFinite(mergedAt) ||
          !pull.mergedBy ||
          (pull.mergedBy.__typename === "User" && !pull.mergedBy.id))
      )
        missingMerge = true;
      const reviews = pull.reviews?.nodes ?? [];
      const independentReview = reviews.some((review) => {
        const at = Date.parse(review?.submittedAt ?? "");
        return (
          review?.author?.__typename === "User" &&
          review.author.id &&
          review.author.id !== subject &&
          at >= from &&
          at <= evaluatedAt &&
          ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"].includes(review.state)
        );
      });
      if (
        !independentReview &&
        (pull.reviews?.pageInfo?.hasNextPage !== false ||
          reviews.some(
            (review) =>
              !review?.author ||
              (review.author.__typename === "User" && !review.author.id),
          ))
      )
        missingReceivedReview = true;
      const mergedInWindow = mergedAt >= from && mergedAt <= evaluatedAt;
      return {
        id: pull.id,
        state:
          pull.state === "MERGED" && !mergedInWindow ? undefined : pull.state,
        merger:
          mergedInWindow && pull.mergedBy?.__typename === "User"
            ? pull.mergedBy.id
            : undefined,
        independentReview,
        bot: pull.author?.__typename === "Bot",
        original: count(pull.changedFiles) && pull.changedFiles > 0,
      };
    },
  );
  collect(
    "issues",
    collection.issueContributions,
    (entry) => entry.issue?.repository,
    ({ issue }) => {
      if (!issue) return;
      const closedAt = Date.parse(issue.closedAt ?? "");
      const closure = issue.timelineItems?.nodes?.[0];
      const closer = closure?.closer;
      const currentClosure =
        Number.isFinite(closedAt) &&
        Date.parse(closure?.createdAt ?? "") === closedAt;
      if (
        issue.state === "CLOSED" &&
        (!currentClosure ||
          !closer ||
          (closer.__typename === "PullRequest" &&
            (!closer.repository?.visibility ||
              (closer.repository.visibility === "PUBLIC" && !closer.author))))
      )
        missingClosure = true;
      const resolvedByPr =
        currentClosure &&
        closedAt >= from &&
        closedAt <= evaluatedAt &&
        issue.state === "CLOSED" &&
        closer?.__typename === "PullRequest" &&
        closer.state === "MERGED" &&
        closer.repository?.visibility === "PUBLIC" &&
        closer.author?.__typename === "User" &&
        closer.author.id &&
        closer.author.id !== subject
          ? closer.id
          : undefined;
      return {
        id: issue.id,
        bot: issue.author?.__typename === "Bot",
        resolvedByPr,
      };
    },
  );
  collect(
    "reviews",
    collection.pullRequestReviewContributions,
    (entry) => entry.pullRequest?.repository,
    ({ pullRequest: pr, pullRequestReview: review }) => {
      if (
        !pr?.id ||
        !review?.id ||
        !review.submittedAt ||
        review.state === "PENDING"
      )
        return;
      if (!pr.author || (pr.author.__typename === "User" && !pr.author.id))
        missingReviewAuthor = true;
      return {
        id: review.id,
        pr: pr.id,
        prAuthor: pr.author?.__typename === "User" ? pr.author.id : undefined,
        bot: review.author?.__typename === "Bot",
      };
    },
  );

  function derived(
    base: Availability | undefined,
    missing: boolean,
  ): Availability {
    return base === "complete" && missing ? "partial" : (base ?? "unavailable");
  }
  coverage.linkedIssues = derived(coverage.issues, missingClosure);
  coverage.merged = derived(coverage.pulls, missingMerge);
  coverage.reviewed = derived(coverage.pulls, missingReceivedReview);
  coverage.reviews = derived(coverage.reviews, missingReviewAuthor);
  coverage.otherReviews = coverage.reviews;
  const hasActivityEvidence = (
    ["commits", "pulls", "issues", "reviews"] as const
  ).some((id) => coverage[id]);
  const otherActivityComplete = (["pulls", "issues", "reviews"] as const).every(
    (id) => coverage[id] === "complete",
  );
  if (hasActivityEvidence) {
    for (const id of ["activeDays", "activeWeeks", "streak"] as const) {
      coverage[id] =
        commitDaysComplete && otherActivityComplete ? "complete" : "partial";
    }
    for (const id of ["qualified", "sustained", "external"] as const) {
      coverage[id] =
        coverage.commits === "complete" && otherActivityComplete
          ? "complete"
          : "partial";
    }
    if (missingProjectEvidence) {
      for (const id of ["qualified", "sustained", "external"] as const)
        coverage[id] = "partial";
    }
  }
  if (
    missingMerge ||
    missingReceivedReview ||
    missingReviewAuthor ||
    missingClosure ||
    missingProjectEvidence
  ) {
    limitations.push(
      "Thiếu một phần thông tin về người hợp nhất, lượt đánh giá hoặc sự kiện đóng issue.",
    );
  }
  if (aggregate) {
    const dates = new Map<number, number>();
    let valid = !partialResponse;
    for (const week of collection.contributionCalendar?.weeks ?? []) {
      for (const day of week.contributionDays) {
        const timestamp = Date.parse(`${day.date}T00:00:00Z`);
        if (!Number.isFinite(timestamp) || !count(day.contributionCount)) {
          valid = false;
          continue;
        }
        if (timestamp < from || timestamp > evaluatedAt) continue;
        const ordinal = utcDay(timestamp);
        if (dates.has(ordinal) && dates.get(ordinal) !== day.contributionCount)
          valid = false;
        dates.set(ordinal, day.contributionCount);
      }
    }
    if (dates.size)
      snapshot.calendarDays = [...dates]
        .filter(([, total]) => total > 0)
        .map(([date]) => date);
    for (const id of ["activeDays", "activeWeeks", "streak"] as const)
      coverage[id] = !dates.size
        ? "unavailable"
        : valid && dates.size === 365
          ? "complete"
          : "partial";
  }
  snapshot.repositories = [...repositories.values()];
  const projectInputComplete =
    commitDaysComplete && otherActivityComplete && !missingProjectEvidence;
  if (!aggregate)
    reconcileCommitHistory(
      snapshot,
      commitHistory,
      commitDaysComplete,
      projectInputComplete,
    );
  snapshot.limitations = [...new Set(limitations)];
  if (excludedNonPublic || (collection.restrictedContributionsCount ?? 0) > 0) {
    snapshot.limitations.push(
      "Hoạt động không công khai hoặc bị hạn chế nằm ngoài phạm vi tính điểm.",
    );
  }
  return snapshot;
}
