import { NextResponse } from "next/server";
import type { ProfileInsights } from "@/interfaces/profile-insights";
import { getValidAuthToken } from "@/lib/auth-token";
import { contributionRange } from "@/lib/profile-activity";

type CommitHistory = {
  pageInfo: { hasNextPage: boolean };
  nodes: {
    additions: number;
    deletions: number;
    parents: { totalCount: number };
  }[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const login = (await params).username.trim().replace(/^@/, "");
  if (!/^[a-z\d-]{1,39}$/i.test(login)) {
    return NextResponse.json(
      { error: "Tên tài khoản không hợp lệ." },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();
  if (!token) {
    return NextResponse.json(
      { error: "Chưa đăng nhập GitHub." },
      { status: 401 },
    );
  }

  const { from: calendarFrom, to: calendarTo } = contributionRange(new Date());
  const today = Date.parse(calendarTo.slice(0, 10));
  const since30Days = new Date(today - 29 * 86_400_000).toISOString();

  try {
    // 1. Lấy danh sách ID các repo công khai gần nhất của người dùng
    const initialRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        query: `query($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            id
            repositories(ownerAffiliations: [OWNER], isFork: false, first: 10, orderBy: { field: PUSHED_AT, direction: DESC }) {
              nodes { id isPrivate }
            }
            contributionsCollection(from: $from, to: $to) {
              commitContributionsByRepository(maxRepositories: 10) {
                repository { id isPrivate }
              }
            }
          }
        }`,
        variables: { login, from: calendarFrom, to: calendarTo },
      }),
    });

    if (!initialRes.ok) {
      return NextResponse.json({
        repositories: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
        partial: false,
      });
    }

    const { data: initialData } = await initialRes.json();
    const user = initialData?.user;
    if (!user) {
      return NextResponse.json({
        repositories: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
        partial: false,
      });
    }

    const collectionRepos = (
      user.contributionsCollection?.commitContributionsByRepository ?? []
    )
      .filter(
        ({ repository }: { repository: { isPrivate: boolean } }) =>
          !repository.isPrivate,
      )
      .map(({ repository }: { repository: { id: string } }) => repository.id);

    const ownedRepos = (user.repositories?.nodes ?? [])
      .filter((r: { isPrivate: boolean }) => !r.isPrivate)
      .map((r: { id: string }) => r.id);

    const repos = Array.from(
      new Set([...collectionRepos, ...ownedRepos]),
    ).slice(0, 5);

    if (!repos.length) {
      return NextResponse.json({
        repositories: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
        partial: false,
      });
    }

    // 2. Query commit additions & deletions trên nhánh mặc định 30 ngày qua
    const commitRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        query: `query($repos: [ID!]!, $author: ID!, $from: GitTimestamp!, $to: GitTimestamp!) {
          nodes(ids: $repos) {
            ... on Repository {
              isPrivate
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 50, author: { id: $author }, since: $from, until: $to) {
                      pageInfo { hasNextPage }
                      nodes { additions deletions parents { totalCount } }
                    }
                  }
                }
              }
            }
          }
        }`,
        variables: {
          repos,
          author: user.id,
          from: since30Days,
          to: calendarTo,
        },
      }),
    });

    if (!commitRes.ok) {
      return NextResponse.json({
        repositories: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
        partial: false,
      });
    }

    const { data: commitData } = await commitRes.json();
    if (!Array.isArray(commitData?.nodes)) {
      return NextResponse.json({
        repositories: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
        partial: false,
      });
    }

    const histories = commitData.nodes.flatMap(
      (
        repo: {
          isPrivate: boolean;
          defaultBranchRef?: { target: { history?: CommitHistory } } | null;
        } | null,
      ) => {
        const history =
          repo?.isPrivate === false
            ? repo.defaultBranchRef?.target.history
            : undefined;
        return history ? [history] : [];
      },
    );

    if (!histories.length) {
      return NextResponse.json({
        repositories: 0,
        commits: 0,
        additions: 0,
        deletions: 0,
        partial: false,
      });
    }

    const commits = histories
      .flatMap((history: CommitHistory) => history.nodes)
      .filter(
        (commit: CommitHistory["nodes"][number]) =>
          commit.parents.totalCount <= 1,
      );

    const payload: ProfileInsights["codeChanges"] = {
      repositories: histories.length,
      commits: commits.length,
      additions: commits.reduce(
        (sum: number, commit: CommitHistory["nodes"][number]) =>
          sum + commit.additions,
        0,
      ),
      deletions: commits.reduce(
        (sum: number, commit: CommitHistory["nodes"][number]) =>
          sum + commit.deletions,
        0,
      ),
      partial:
        repos.length > histories.length ||
        histories.some(
          (history: CommitHistory) => history.pageInfo.hasNextPage,
        ),
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  } catch {
    return NextResponse.json({
      repositories: 0,
      commits: 0,
      additions: 0,
      deletions: 0,
      partial: false,
    });
  }
}
