// app/api/user/data/route.ts

import { NextResponse } from "next/server";
import {
  getValidAuthToken,
  refreshGitHubToken,
  setAuthCookies,
} from "@/lib/auth-token";
import { cookies } from "next/headers";

export async function GET() {
  let token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const getHeaders = (t: string | null) => ({
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitVN-App",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  const safeFetchJson = async (url: string, t: string | null) => {
    try {
      const res = await fetch(url, {
        headers: getHeaders(t),
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  try {
    // 1. Gọi song song thông tin User, Organizations, Memberships, Invitations và Repositories (Page 1)
    let [userRes, orgsRes, reposRes1] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: getHeaders(token),
        cache: "no-store",
      }),
      fetch("https://api.github.com/user/orgs?per_page=100", {
        headers: getHeaders(token),
        cache: "no-store",
      }),
      fetch(
        "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100",
        {
          headers: getHeaders(token),
          cache: "no-store",
        },
      ),
    ]);

    // Nếu gặp 401 (token bị revoke hoặc hết hạn đột ngột), thử auto-refresh 1 lần
    if (userRes.status === 401 || reposRes1.status === 401) {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get("github_refresh_token")?.value;
      if (refreshToken) {
        const refreshResult = await refreshGitHubToken(refreshToken);
        if (refreshResult.ok && refreshResult.data) {
          await setAuthCookies(cookieStore, refreshResult.data);
          token = refreshResult.data.access_token;

          // Thử lại với token mới
          [userRes, orgsRes, reposRes1] = await Promise.all([
            fetch("https://api.github.com/user", {
              headers: getHeaders(token),
              cache: "no-store",
            }),
            fetch("https://api.github.com/user/orgs?per_page=100", {
              headers: getHeaders(token),
              cache: "no-store",
            }),
            fetch(
              "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100",
              {
                headers: getHeaders(token),
                cache: "no-store",
              },
            ),
          ]);
        }
      }
    }

    if (!userRes.ok && !reposRes1.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userObj = userRes.ok ? await userRes.json() : null;
    const directOrgs = orgsRes.ok ? await orgsRes.json() : [];
    let repos: any[] = reposRes1.ok ? await reposRes1.json() : [];

    // Gọi thêm memberships (hỗ trợ cả các org mà membership là private) và repository invitations (lời mời repo chưa accept)
    const [membershipsData, invitationsData] = await Promise.all([
      safeFetchJson(
        "https://api.github.com/user/memberships/orgs?state=active&per_page=100",
        token,
      ),
      safeFetchJson(
        "https://api.github.com/user/repository_invitations?per_page=100",
        token,
      ),
    ]);

    // Nếu trang 1 đủ 100 repo, lấy thêm trang 2 & 3 để không bỏ sót repo
    if (repos.length >= 100) {
      try {
        const [p2, p3] = await Promise.all([
          safeFetchJson(
            "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=2",
            token,
          ),
          safeFetchJson(
            "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=3",
            token,
          ),
        ]);
        if (Array.isArray(p2)) repos = repos.concat(p2);
        if (Array.isArray(p3)) repos = repos.concat(p3);
      } catch (err) {
        console.warn("Lỗi lấy repo trang bổ sung:", err);
      }
    }

    const orgsMap = new Map<string, any>();

    // 2. Thêm các Organizations chính thức từ /user/orgs
    if (Array.isArray(directOrgs)) {
      directOrgs.forEach((org: any) => {
        if (org && org.login) {
          orgsMap.set(org.login.toLowerCase(), {
            login: org.login,
            id: org.id,
            avatar_url: org.avatar_url,
            description: org.description || null,
            isUser: false,
          });
        }
      });
    }

    // 3. Thêm các Organizations từ memberships (bắt được cả org có private membership)
    if (Array.isArray(membershipsData)) {
      membershipsData.forEach((m: any) => {
        const org = m?.organization;
        if (org && org.login) {
          const key = org.login.toLowerCase();
          if (!orgsMap.has(key)) {
            orgsMap.set(key, {
              login: org.login,
              id: org.id,
              avatar_url: org.avatar_url,
              description: org.description || null,
              role: m.role || "member",
              isUser: false,
            });
          }
        }
      });
    }

    // 4. Quét thêm các Organization từ owner của repo
    repos.forEach((repo: any) => {
      if (
        repo.owner &&
        repo.owner.type &&
        repo.owner.type.toLowerCase() === "organization"
      ) {
        const key = repo.owner.login.toLowerCase();
        if (!orgsMap.has(key)) {
          orgsMap.set(key, {
            login: repo.owner.login,
            id: repo.owner.id,
            avatar_url: repo.owner.avatar_url,
            description: null,
            isUser: false,
          });
        }
      }
    });

    // 5. Quét toàn bộ repo của các Organization để không bỏ sót repo mới tạo của thành viên khác trong org
    const orgsList = Array.from(orgsMap.values());
    if (orgsList.length > 0) {
      const extraReposPromises = orgsList.slice(0, 10).map(async (org) => {
        try {
          const orgRepos = await safeFetchJson(
            `https://api.github.com/orgs/${org.login}/repos?per_page=100&type=all&sort=updated`,
            token,
          );
          return Array.isArray(orgRepos) ? orgRepos : [];
        } catch {
          return [];
        }
      });

      const extraReposNested = await Promise.all(extraReposPromises);
      extraReposNested.forEach((orgRepos) => {
        if (Array.isArray(orgRepos)) {
          orgRepos.forEach((repo) => {
            if (!repos.some((existing) => existing.id === repo.id)) {
              repos.push(repo);
            }
          });
        }
      });
    }

    // 6. User cá nhân cũng là 1 org context (đứng đầu danh sách)
    const finalOrgs: any[] = [];
    if (userObj) {
      finalOrgs.push({
        login: userObj.login,
        id: userObj.id,
        avatar_url: userObj.avatar_url,
        description: "Tài khoản cá nhân",
        isUser: true,
      });
    }

    // Nối tiếp các Organizations bên ngoài
    orgsMap.forEach((org) => {
      // Tránh trùng nếu user.login trùng tên org
      if (!userObj || org.login.toLowerCase() !== userObj.login.toLowerCase()) {
        finalOrgs.push(org);
      }
    });

    return NextResponse.json(
      {
        repos,
        orgs: finalOrgs,
        invitations: Array.isArray(invitationsData) ? invitationsData : [],
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Lỗi API user/data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
