import { NextResponse } from "next/server";
import type { TaskAssignee } from "@/interfaces/jira";
import { getValidAuthToken } from "@/lib/auth-token";

interface CacheEntry {
  members: TaskAssignee[];
  timestamp: number;
}

const membersCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60s cache

async function getAuthToken(): Promise<string | undefined> {
  const token = await getValidAuthToken();
  return token || undefined;
}

async function listAccess(owner: string, repo: string, page: number) {
  const token = await getValidAuthToken();
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URLSearchParams({ per_page: "30", page: String(page) });
  const path = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  try {
    const response = await fetch(
      `https://api.github.com/repos/${path}/collaborators?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Không lấy được danh sách quyền truy cập từ GitHub." },
        { status: response.status },
      );
    }
    const members: { login: string; avatar_url: string; role_name?: string }[] =
      await response.json();
    return NextResponse.json({
      members: members.map(({ login, avatar_url, role_name }) => ({
        login,
        avatar_url,
        role: role_name ?? null,
      })),
      hasNext: response.headers.get("link")?.includes('rel="next"') ?? false,
    });
  } catch {
    return NextResponse.json(
      { error: "Không kết nối được GitHub." },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  if (searchParams.get("scope") === "access") {
    const page = Number(searchParams.get("page") ?? "1");
    if (!Number.isSafeInteger(page) || page < 1) {
      return NextResponse.json(
        { error: "Trang không hợp lệ." },
        { status: 400 },
      );
    }
    return listAccess(owner, repo, page);
  }

  const cacheKey = `${owner}/${repo}`.toLowerCase();
  const cached = membersCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { members: cached.members, source: "cache" },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    );
  }

  const token = await getAuthToken();
  const membersMap = new Map<string, TaskAssignee>();

  // 1. Luôn thêm owner repo vào danh sách
  membersMap.set(owner.toLowerCase(), {
    login: owner,
    name: owner,
    avatar_url: `https://github.com/${owner}.png`,
  });

  if (token) {
    // 2. Thử truy vấn GraphQL để lấy collaborators và assignableUsers
    try {
      const gqlQuery = `
        query($owner: String!, $repo: String!) {
          viewer {
            login
            name
            avatarUrl
          }
          repository(owner: $owner, name: $repo) {
            assignableUsers(first: 50) {
              nodes {
                login
                name
                avatarUrl
              }
            }
            collaborators(first: 50) {
              nodes {
                login
                name
                avatarUrl
              }
            }
          }
        }
      `;

      const gqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "GitVN-App",
        },
        body: JSON.stringify({
          query: gqlQuery,
          variables: { owner, repo },
        }),
        cache: "no-store",
      });

      if (gqlRes.ok) {
        const json = await gqlRes.json();
        const data = json?.data;

        if (data?.viewer?.login) {
          membersMap.set(data.viewer.login.toLowerCase(), {
            login: data.viewer.login,
            name: data.viewer.name || data.viewer.login,
            avatar_url: data.viewer.avatarUrl,
          });
        }

        const assignables = data?.repository?.assignableUsers?.nodes || [];
        for (const u of assignables) {
          if (u?.login) {
            membersMap.set(u.login.toLowerCase(), {
              login: u.login,
              name: u.name || u.login,
              avatar_url: u.avatarUrl,
            });
          }
        }

        const collabs = data?.repository?.collaborators?.nodes || [];
        for (const u of collabs) {
          if (u?.login) {
            membersMap.set(u.login.toLowerCase(), {
              login: u.login,
              name: u.name || u.login,
              avatar_url: u.avatarUrl,
            });
          }
        }
      }
    } catch {
      // Fallback bên dưới
    }

    // 3. Fallback thêm từ Contributors REST API nếu danh sách còn ít
    if (membersMap.size <= 1) {
      try {
        const contribRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "GitVN-App",
            },
            cache: "no-store",
          },
        );
        if (contribRes.ok) {
          const contribs = await contribRes.json();
          if (Array.isArray(contribs)) {
            for (const c of contribs) {
              if (c.login && !c.login.includes("[bot]")) {
                membersMap.set(c.login.toLowerCase(), {
                  login: c.login,
                  name: c.login,
                  avatar_url: c.avatar_url,
                });
              }
            }
          }
        }
      } catch {}
    }
  }

  const membersList = Array.from(membersMap.values());
  membersCache.set(cacheKey, { members: membersList, timestamp: now });

  return NextResponse.json(
    { members: membersList, source: "github" },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    },
  );
}
