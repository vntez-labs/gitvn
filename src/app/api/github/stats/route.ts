import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

// In-Memory Cache lưu kết quả thống kê từng repo
interface CacheEntry {
  data: any;
  timestamp: number;
}

const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút cache (người dùng có thể nhấn Refresh để xóa cache ngay lập tức)

// Helper parse JSON an toàn tuyệt đối
async function safeFetchJson(
  url: string,
  headers: Record<string, string>,
  fallback: any = [],
) {
  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok || res.status === 204) return fallback;

    const text = await res.text();
    if (!text || !text.trim()) return fallback;

    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// Hàm lọc các tài khoản Bot / Automation (như Copilot, dependabot, github-actions, web-flow)
function isBot(login?: string, type?: string): boolean {
  if (!login) return false;
  const lower = login.toLowerCase();
  return (
    type === "Bot" ||
    lower.endsWith("[bot]") ||
    lower === "copilot" ||
    lower.includes("copilot") ||
    lower === "github-actions" ||
    lower === "dependabot" ||
    lower === "web-flow" ||
    lower === "ghost"
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  const cacheKey = `${owner}/${repo}`.toLowerCase();
  const now = Date.now();

  // Cho phép xóa cache khi yêu cầu refresh
  if (forceRefresh) {
    statsCache.delete(cacheKey);
  }

  const cached = statsCache.get(cacheKey);

  // 1. Trả về cache nếu còn trong hạn và không yêu cầu refresh
  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  }

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // 2. Fetch song song các nguồn dữ liệu:
    // - GraphQL: Số liệu PRs, Issues, Collaborators chính thức, Commit history trên default branch (additions/deletions),
    //   và danh sách Pull Requests gần nhất (additions, deletions, author, mergedBy).
    // - Collaborators: Danh sách thành viên chính thức được cấp quyền vào repository.
    // - Invitations: Danh sách thành viên đang có thư mời vào repository.
    // - Owner Profile: Thông tin của chủ repository (Nhóm trưởng).
    // - basicContributors: Danh sách contributors truyền thống để đồng bộ số commit.
    // - activity: Hoạt động commit 52 tuần qua.
    const [
      gqlRes,
      collaboratorsRes,
      invitationsRes,
      ownerUserRes,
      basicContributors,
      activity,
    ] = await Promise.all([
      fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query($owner: String!, $name: String!) {
              repository(owner: $owner, name: $name) {
                totalPulls: pullRequests { totalCount }
                openPulls: pullRequests(states: OPEN) { totalCount }
                mergedPulls: pullRequests(states: MERGED) { totalCount }
                closedPulls: pullRequests(states: CLOSED) { totalCount }
                totalIssues: issues { totalCount }
                openIssues: issues(states: OPEN) { totalCount }
                closedIssues: issues(states: CLOSED) { totalCount }
                collaborators(first: 50, affiliation: ALL) {
                  nodes {
                    login
                    name
                    avatarUrl
                    url
                  }
                }
                assignableUsers(first: 50) {
                  nodes {
                    login
                    name
                    avatarUrl
                    url
                  }
                }
                mentionableUsers(first: 50) {
                  nodes {
                    login
                    name
                    avatarUrl
                    url
                  }
                }
                defaultBranchRef {
                  name
                  target {
                    ... on Commit {
                      history(first: 100) {
                        totalCount
                        nodes {
                          oid
                          author {
                            name
                            avatarUrl
                            user {
                              login
                              url
                            }
                          }
                          additions
                          deletions
                        }
                      }
                    }
                  }
                }
                pullRequests(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
                  nodes {
                    number
                    state
                    additions
                    deletions
                    author {
                      login
                      avatarUrl
                      url
                    }
                    mergedBy {
                      login
                      avatarUrl
                      url
                    }
                  }
                }
              }
            }
          `,
          variables: { owner, name: repo },
        }),
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),

      safeFetchJson(
        `https://api.github.com/repos/${owner}/${repo}/collaborators?per_page=100`,
        headers,
        [],
      ),
      safeFetchJson(
        `https://api.github.com/repos/${owner}/${repo}/invitations`,
        headers,
        [],
      ),
      safeFetchJson(`https://api.github.com/users/${owner}`, headers, null),
      safeFetchJson(
        `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`,
        headers,
        [],
      ),
      safeFetchJson(
        `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`,
        headers,
        [],
      ),
    ]);

    const repoGql = gqlRes?.data?.repository;

    if (gqlRes?.errors) {
      console.warn(
        "[GitHub Stats] GraphQL errors:",
        JSON.stringify(gqlRes.errors),
      );
    }

    // 3. Khởi tạo danh bạ thành viên thực tế của dự án
    const teamMembersMap = new Map<
      string,
      {
        author: {
          login: string;
          avatar_url: string;
          html_url: string;
          name?: string;
        };
        commits: number;
        additions: number;
        deletions: number;
        linesChanged: number;
        mergedPRs: number;
        mergedByCount: number;
        role?: string;
      }
    >();

    // Hàm an toàn thêm thành viên vào danh bạ nếu chưa có
    const addMemberIfMissing = (
      user: {
        login?: string;
        avatarUrl?: string;
        avatar_url?: string;
        url?: string;
        html_url?: string;
        name?: string;
        type?: string;
      },
      role = "Collaborator",
    ) => {
      if (!user?.login || isBot(user.login, user.type)) return;
      const key = user.login.toLowerCase();
      const existing = teamMembersMap.get(key);
      if (!existing) {
        teamMembersMap.set(key, {
          author: {
            login: user.login,
            avatar_url:
              user.avatarUrl ||
              user.avatar_url ||
              `https://avatars.githubusercontent.com/${user.login}`,
            html_url:
              user.url || user.html_url || `https://github.com/${user.login}`,
            name: user.name || user.login,
          },
          commits: 0,
          additions: 0,
          deletions: 0,
          linesChanged: 0,
          mergedPRs: 0,
          mergedByCount: 0,
          role,
        });
      } else {
        if (
          user.name &&
          (!existing.author.name ||
            existing.author.name === existing.author.login)
        ) {
          existing.author.name = user.name;
        }
      }
    };

    // 3a. Đưa Owner (Nhóm trưởng) vào danh sách
    const ownerKey = owner.toLowerCase();
    teamMembersMap.set(ownerKey, {
      author: {
        login: owner,
        avatar_url:
          ownerUserRes?.avatar_url ||
          `https://avatars.githubusercontent.com/${owner}`,
        html_url: ownerUserRes?.html_url || `https://github.com/${owner}`,
        name: ownerUserRes?.name || owner,
      },
      commits: 0,
      additions: 0,
      deletions: 0,
      linesChanged: 0,
      mergedPRs: 0,
      mergedByCount: 0,
      role: "Owner / Nhóm trưởng",
    });

    // 3b. Đưa tất cả Collaborators từ GraphQL
    const gqlCollabs = repoGql?.collaborators?.nodes || [];
    gqlCollabs.forEach((collab: any) => {
      addMemberIfMissing(collab, "Collaborator");
    });

    // 3c. Đưa tất cả assignableUsers & mentionableUsers từ GraphQL (bắt trọn cả collaborator chưa commit)
    const gqlAssignable = repoGql?.assignableUsers?.nodes || [];
    gqlAssignable.forEach((u: any) => {
      addMemberIfMissing(u, "Collaborator");
    });

    const gqlMentionable = repoGql?.mentionableUsers?.nodes || [];
    gqlMentionable.forEach((u: any) => {
      addMemberIfMissing(u, "Collaborator");
    });

    // 3d. Đưa tất cả Collaborators từ REST (loại bỏ Bot như Copilot)
    if (Array.isArray(collaboratorsRes)) {
      collaboratorsRes.forEach((collab: any) => {
        addMemberIfMissing(
          collab,
          collab.permissions?.admin ? "Admin" : "Collaborator",
        );
      });
    }

    // 3e. Đưa thêm các thành viên đang có lời mời (Invitations)
    if (Array.isArray(invitationsRes)) {
      invitationsRes.forEach((inv: any) => {
        if (inv?.invitee) addMemberIfMissing(inv.invitee, "Collaborator");
      });
    }

    // 3e. Cộng dồn từ tất cả Pull Requests (cả đã merge và đang mở)
    const prNodes = repoGql?.pullRequests?.nodes || [];
    prNodes.forEach((pr: any) => {
      // Tác giả của Pull Request
      if (pr.author?.login && !isBot(pr.author.login)) {
        const login = pr.author.login;
        const key = login.toLowerCase();
        const existing = teamMembersMap.get(key) || {
          author: {
            login,
            avatar_url:
              pr.author.avatarUrl ||
              `https://avatars.githubusercontent.com/${login}`,
            html_url: pr.author.url || `https://github.com/${login}`,
            name: login,
          },
          commits: 0,
          additions: 0,
          deletions: 0,
          linesChanged: 0,
          mergedPRs: 0,
          mergedByCount: 0,
        };

        if (pr.state === "MERGED") {
          existing.mergedPRs += 1;
          existing.additions += pr.additions || 0;
          existing.deletions += pr.deletions || 0;
          existing.linesChanged += (pr.additions || 0) + (pr.deletions || 0);
        }

        teamMembersMap.set(key, existing);
      }

      // Người duyệt & merge Pull Request (Nhóm trưởng / Reviewer)
      if (pr.mergedBy?.login && !isBot(pr.mergedBy.login)) {
        const mergerLogin = pr.mergedBy.login;
        const key = mergerLogin.toLowerCase();
        const existing = teamMembersMap.get(key) || {
          author: {
            login: mergerLogin,
            avatar_url:
              pr.mergedBy.avatarUrl ||
              `https://avatars.githubusercontent.com/${mergerLogin}`,
            html_url: pr.mergedBy.url || `https://github.com/${mergerLogin}`,
            name: mergerLogin,
          },
          commits: 0,
          additions: 0,
          deletions: 0,
          linesChanged: 0,
          mergedPRs: 0,
          mergedByCount: 0,
        };
        existing.mergedByCount += 1;
        teamMembersMap.set(key, existing);
      }
    });

    // 3f. Cộng dồn từ lịch sử commit trên nhánh mặc định
    const commitNodes = repoGql?.defaultBranchRef?.target?.history?.nodes || [];
    commitNodes.forEach((node: any) => {
      const login = node.author?.user?.login;
      if (!login || isBot(login)) return;
      const key = login.toLowerCase();
      const existing = teamMembersMap.get(key) || {
        author: {
          login,
          avatar_url:
            node.author?.avatarUrl ||
            `https://avatars.githubusercontent.com/${login}`,
          html_url: node.author?.user?.url || `https://github.com/${login}`,
          name: node.author?.name || login,
        },
        commits: 0,
        additions: 0,
        deletions: 0,
        linesChanged: 0,
        mergedPRs: 0,
        mergedByCount: 0,
      };

      existing.commits += 1;

      // Nếu tác giả này chưa có dòng code từ PR (như Nhóm trưởng commit trực tiếp, merge & sửa code),
      // lấy trực tiếp additions/deletions từ các commit này
      if (existing.mergedPRs === 0) {
        existing.additions += node.additions || 0;
        existing.deletions += node.deletions || 0;
        existing.linesChanged += (node.additions || 0) + (node.deletions || 0);
      }
      teamMembersMap.set(key, existing);
    });

    // 3g. Đồng bộ thêm từ basicContributors
    if (Array.isArray(basicContributors)) {
      basicContributors.forEach((bc: any) => {
        if (!bc.login || isBot(bc.login, bc.type)) return;
        const key = bc.login.toLowerCase();
        const existing = teamMembersMap.get(key);
        if (existing) {
          existing.commits = Math.max(existing.commits, bc.contributions || 0);
        } else {
          teamMembersMap.set(key, {
            author: {
              login: bc.login,
              avatar_url: bc.avatar_url,
              html_url: bc.html_url || `https://github.com/${bc.login}`,
              name: bc.login,
            },
            commits: bc.contributions || 0,
            additions: 0,
            deletions: 0,
            linesChanged: 0,
            mergedPRs: 0,
            mergedByCount: 0,
          });
        }
      });
    }

    // 3h. Lọc bỏ hoàn toàn Bot và tính Impact Score
    const contributors = Array.from(teamMembersMap.values())
      .filter((c) => !isBot(c.author.login))
      .map((c) => {
        const impactScore =
          (c.mergedPRs || 0) * 35 +
          (c.mergedByCount || 0) * 20 +
          (c.commits || 0) * 2 +
          Math.round(Math.min(c.linesChanged || 0, 50000) / 100);

        return {
          ...c,
          total: c.commits,
          impactScore,
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore);

    // Tổng số thành viên thực tế của Repository (Owner + Collaborators)
    const totalContributors = contributors.length;

    let totalPulls = 0;
    let openPulls = 0;
    let mergedPulls = 0;
    let closedPulls = 0;
    let mergeRate = 0;

    let totalIssues = 0;
    let openIssues = 0;
    let closedIssues = 0;
    let closeRate = 0;

    let totalCommits: number | undefined;

    if (repoGql) {
      totalPulls = repoGql.totalPulls?.totalCount ?? 0;
      openPulls = repoGql.openPulls?.totalCount ?? 0;
      mergedPulls = repoGql.mergedPulls?.totalCount ?? 0;
      closedPulls = repoGql.closedPulls?.totalCount ?? 0;
      mergeRate =
        totalPulls > 0 ? Math.round((mergedPulls / totalPulls) * 100) : 0;

      totalIssues = repoGql.totalIssues?.totalCount ?? 0;
      openIssues = repoGql.openIssues?.totalCount ?? 0;
      closedIssues = repoGql.closedIssues?.totalCount ?? 0;
      closeRate =
        totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;

      totalCommits = repoGql.defaultBranchRef?.target?.history?.totalCount;
    } else {
      const repoDetails = await safeFetchJson(
        `https://api.github.com/repos/${owner}/${repo}`,
        headers,
        null,
      );
      if (repoDetails) {
        openIssues = repoDetails.open_issues_count || 0;
      }
    }

    const payload = {
      contributors,
      totalContributors,
      totalCommits,
      activity: Array.isArray(activity) ? activity : [],
      pulse: {
        pulls: {
          total: totalPulls,
          open: openPulls,
          merged: mergedPulls,
          closed: closedPulls,
          mergeRate,
        },
        issues: {
          total: totalIssues,
          open: openIssues,
          closed: closedIssues,
          closeRate,
        },
      },
    };

    // 4. Ghi vào cache
    statsCache.set(cacheKey, { data: payload, timestamp: now });

    return NextResponse.json(payload);
  } catch (error) {
    console.error(`[API /stats] Lỗi khi xử lý repo ${owner}/${repo}:`, error);

    if (cached) {
      return NextResponse.json(cached.data);
    }

    return NextResponse.json({
      contributors: [],
      totalContributors: 0,
      activity: [],
      pulse: {
        pulls: { total: 0, open: 0, merged: 0, closed: 0, mergeRate: 0 },
        issues: { total: 0, open: 0, closed: 0, closeRate: 0 },
      },
    });
  }
}
