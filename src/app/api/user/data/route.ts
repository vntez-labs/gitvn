// app/api/user/data/route.ts

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // 1. Gọi song song thông tin User, danh sách Organizations và Repositories (Page 1)
    const [userRes, orgsRes, reposRes1] = await Promise.all([
      fetch("https://api.github.com/user", { headers: authHeaders }),
      fetch("https://api.github.com/user/orgs?per_page=100", {
        headers: authHeaders,
      }),
      fetch(
        "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100",
        {
          headers: authHeaders,
        },
      ),
    ]);

    const userObj = userRes.ok ? await userRes.json() : null;
    const directOrgs = orgsRes.ok ? await orgsRes.json() : [];
    let repos: any[] = reposRes1.ok ? await reposRes1.json() : [];

    // Nếu trang 1 đủ 100 repo, lấy thêm trang 2 để không bỏ sót repo
    if (repos.length >= 100) {
      try {
        const reposRes2 = await fetch(
          "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=2",
          { headers: authHeaders },
        );
        if (reposRes2.ok) {
          const page2 = await reposRes2.json();
          if (Array.isArray(page2)) {
            repos = repos.concat(page2);
          }
        }
      } catch (err) {
        console.warn("Lỗi lấy repo trang 2:", err);
      }
    }

    const orgsMap = new Map<string, any>();

    // 2. Thêm các Organizations chính thức từ /user/orgs
    if (Array.isArray(directOrgs)) {
      directOrgs.forEach((org: any) => {
        orgsMap.set(org.login.toLowerCase(), {
          login: org.login,
          id: org.id,
          avatar_url: org.avatar_url,
          description: org.description || null,
          isUser: false,
        });
      });
    }

    // 3. Quét thêm các Organization từ owner của repo (trường hợp có org ngoài khác)
    repos.forEach((repo: any) => {
      if (repo.owner && repo.owner.type === "Organization") {
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

    // 4. Nếu có org trong /user/orgs mà chưa có repo nào xuất hiện trong danh sách repos, gọi bổ sung repos của org đó
    const orgsMissingRepos = Array.from(orgsMap.values()).filter(
      (org) =>
        !repos.some(
          (r) => r.owner?.login?.toLowerCase() === org.login.toLowerCase(),
        ),
    );

    if (orgsMissingRepos.length > 0) {
      const extraReposPromises = orgsMissingRepos
        .slice(0, 5)
        .map(async (org) => {
          try {
            const res = await fetch(
              `https://api.github.com/orgs/${org.login}/repos?per_page=100&type=all`,
              {
                headers: authHeaders,
              },
            );
            return res.ok ? await res.json() : [];
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

    // 5. User cá nhân cũng là 1 orgs (đứng đầu danh sách)
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
      { repos, orgs: finalOrgs },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
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
