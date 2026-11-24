import type { ScoringCollection } from "./github";
import type {
  CollaborationEvidence,
  IntegrationEvidence,
  RawActivitySnapshot,
} from "./models";

type HumanActor = { __typename: string; id?: string };
type RoleRepository = {
  id: string;
  visibility: string;
  nameWithOwner?: string;
  isFork?: boolean;
  isArchived?: boolean;
  owner?: { id: string };
};

export interface RolePull {
  id: string;
  repository: RoleRepository;
  author: HumanActor | null;
  merged?: boolean;
  state?: string;
  mergedAt?: string | null;
  mergedBy?: HumanActor | null;
  closingIssuesReferences?: {
    nodes?:
      | ({
          id: string;
          closed: boolean;
          author: HumanActor | null;
          repository: { visibility: string };
          timelineItems?: {
            nodes?: ({
              createdAt?: string;
              closer?: { id?: string } | null;
            } | null)[];
          };
        } | null)[]
      | null;
  } | null;
}

const actor = "__typename ... on User { id }";
export const mergeFields = `merged mergedAt mergedBy { ${actor} }`;
export const candidateFields = `
  id ${mergeFields} author { ${actor} }
  repository { id nameWithOwner visibility isFork isArchived owner { id } }
  closingIssuesReferences(first: 3) {
    nodes {
      id closed author { ${actor} } repository { visibility }
      timelineItems(last: 1, itemTypes: [CLOSED_EVENT]) {
        nodes { ... on ClosedEvent { createdAt closer { ... on PullRequest { id } } } }
      }
    }
  }
`;

const human = (actor?: HumanActor | null) =>
  actor?.__typename === "User" && actor.id ? actor.id : undefined;

export function collaborationInputs(
  snapshot: RawActivitySnapshot,
  collection: ScoringCollection | null,
  search?: { pulls: RolePull[]; sources: string[] },
) {
  const repoIds = new Set(snapshot.repositories.map((repo) => repo.id));
  const evidence: CollaborationEvidence = {
    integrations: [],
    maintainer:
      collection?.pullRequestReviewContributions?.nodes || search
        ? "partial"
        : "unavailable",
    issues: search ? "partial" : "unavailable",
    sources: [
      ...(collection?.pullRequestContributions?.nodes
        ? ["github-user-authored-pr"]
        : []),
      ...(collection?.pullRequestReviewContributions?.nodes
        ? ["github-user-review-contributions"]
        : []),
      ...(search?.sources ?? []),
    ],
  };
  const authored = new Set(
    collection?.pullRequestContributions?.nodes?.flatMap((item) =>
      item?.isRestricted === false &&
      human(item.pullRequest?.author) === snapshot.subject
        ? [item.pullRequest.id]
        : [],
    ),
  );
  for (const event of snapshot.events) {
    if (event.kind !== "pulls" || authored.has(event.id)) continue;
    delete event.merger;
    delete event.independentReview;
    if (snapshot.coverage.merged === "complete")
      snapshot.coverage.merged = "partial";
    if (snapshot.coverage.reviewed === "complete")
      snapshot.coverage.reviewed = "partial";
  }
  // Authored contributions enumerate PRs opened inside the window. Older
  // authored PRs can receive a merge or review during the current interval.
  if (snapshot.coverage.merged === "complete")
    snapshot.coverage.merged = "partial";
  if (snapshot.coverage.reviewed === "complete")
    snapshot.coverage.reviewed = "partial";
  const pulls: RolePull[] = [
    ...(collection?.pullRequestContributions?.nodes ?? []).flatMap((item) =>
      item?.isRestricted === false ? [item.pullRequest] : [],
    ),
    ...(collection?.pullRequestReviewContributions?.nodes ?? []).flatMap(
      (item) => (item?.isRestricted === false ? [item.pullRequest] : []),
    ),
    ...(search?.pulls ?? []),
  ];
  for (const pr of pulls) {
    if (
      !pr?.id ||
      pr.repository?.visibility !== "PUBLIC" ||
      !(pr.merged ?? pr.state === "MERGED")
    )
      continue;
    const author = human(pr.author);
    const merger = human(pr.mergedBy);
    const mergedAt = Date.parse(pr.mergedAt ?? "");
    if (
      !author ||
      !Number.isFinite(mergedAt) ||
      (author !== snapshot.subject && merger !== snapshot.subject)
    )
      continue;
    if (!repoIds.has(pr.repository.id)) {
      if (
        !pr.repository.owner?.id ||
        typeof pr.repository.isFork !== "boolean" ||
        typeof pr.repository.isArchived !== "boolean"
      )
        continue;
      snapshot.repositories.push({
        id: pr.repository.id,
        visibility: "public",
        owned: pr.repository.owner.id === snapshot.subject,
        fork: pr.repository.isFork,
        archived: pr.repository.isArchived,
      });
      repoIds.add(pr.repository.id);
    }
    const issues: NonNullable<IntegrationEvidence["issues"]> = [];
    for (const issue of pr.closingIssuesReferences?.nodes ?? []) {
      if (!issue?.closed || issue.repository?.visibility !== "PUBLIC") continue;
      const closure = issue.timelineItems?.nodes?.[0];
      const issueAuthor = human(issue.author);
      const closedAt = Date.parse(closure?.createdAt ?? "");
      if (
        issueAuthor &&
        closure?.closer?.id === pr.id &&
        Number.isFinite(closedAt)
      )
        issues.push({ id: issue.id, author: issueAuthor, closedAt });
    }
    evidence.integrations.push({
      id: pr.id,
      repo: pr.repository.id,
      author,
      merger,
      mergedAt,
      issues,
    });
  }
  snapshot.collaboration = evidence;
  return snapshot;
}

export function reviewedRepositoryNames(collection: ScoringCollection | null) {
  const repos = new Map<string, { name: string; prs: Set<string> }>();
  for (const item of collection?.pullRequestReviewContributions?.nodes ?? []) {
    if (item?.isRestricted !== false) continue;
    const pr = item.pullRequest;
    const repo = pr?.repository;
    const name = repo?.nameWithOwner;
    if (
      repo?.visibility !== "PUBLIC" ||
      !name ||
      !/^[a-z\d-]+\/[a-z\d_.-]+$/i.test(name) ||
      !pr?.id
    )
      continue;
    const entry = repos.get(repo.id) ?? { name, prs: new Set<string>() };
    entry.prs.add(pr.id);
    repos.set(repo.id, entry);
  }
  return [...repos.values()]
    .filter((entry) => entry.prs.size >= 2)
    .sort((a, b) => b.prs.size - a.prs.size || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((repo) => repo.name);
}
