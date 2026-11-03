import { type NextRequest, NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

interface RawGitHubUser {
  id?: number;
  login?: string;
  avatar_url?: string;
  html_url?: string;
  name?: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get("q")?.trim() || "";
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!rawQ || rawQ.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const token = await getValidAuthToken();

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GitVN-App",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cleanQ = rawQ.replace(/^@/, "").trim();
  const isEmail = cleanQ.includes("@");
  const userMap = new Map<
    string,
    {
      id: number;
      login: string;
      avatar_url: string;
      html_url: string;
      isCollaborator?: boolean;
    }
  >();

  const addUser = (u: RawGitHubUser | null | undefined) => {
    if (!u || !u.login) return;
    const key = u.login.toLowerCase();
    if (!userMap.has(key)) {
      userMap.set(key, {
        id: u.id || 0,
        login: u.login,
        avatar_url: u.avatar_url || `https://github.com/${u.login}.png`,
        html_url: u.html_url || `https://github.com/${u.login}`,
      });
    }
  };

  try {
    // 1. Nếu là email: Tìm commit author / committer theo email (Giải quyết trường hợp email private trên profile)
    if (isEmail) {
      try {
        const commitRes = await fetch(
          `https://api.github.com/search/commits?q=author-email:${encodeURIComponent(cleanQ)}&per_page=5`,
          { headers, cache: "no-store" },
        );
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          if (Array.isArray(commitData.items)) {
            for (const item of commitData.items) {
              if (item.author?.login) addUser(item.author);
              if (item.committer?.login) addUser(item.committer);
            }
          }
        }
      } catch {
        // Tiếp tục các bước khác nếu commit search gặp sự cố
      }
    }

    // 2. Direct lookup: Nếu không phải email và query không có dấu cách, thử lấy trực tiếp user profile
    if (!isEmail && !cleanQ.includes(" ")) {
      try {
        const directRes = await fetch(
          `https://api.github.com/users/${encodeURIComponent(cleanQ)}`,
          { headers, cache: "no-store" },
        );
        if (directRes.ok) {
          const directUser = await directRes.json();
          if (directUser && directUser.login) {
            addUser(directUser);
          }
        }
      } catch {
        // Bỏ qua nếu không tìm thấy direct user
      }
    }

    // 3. User search tiêu chuẩn
    try {
      const searchUrl = isEmail
        ? `https://api.github.com/search/users?q=${encodeURIComponent(cleanQ)}+in:email&per_page=8`
        : `https://api.github.com/search/users?q=${encodeURIComponent(cleanQ)}&per_page=8`;
      const searchRes = await fetch(searchUrl, { headers, cache: "no-store" });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.items)) {
          for (const u of searchData.items) {
            addUser(u);
          }
        }
      }
    } catch {
      // Bỏ qua nếu search gặp lỗi
    }

    // 4. Fallback cho email: nếu chưa tìm thấy tài khoản nào, thử tìm kiếm với prefix trước dấu @
    if (isEmail && userMap.size === 0) {
      const prefix = cleanQ.split("@")[0].trim();
      if (prefix.length >= 2) {
        try {
          const prefixRes = await fetch(
            `https://api.github.com/search/users?q=${encodeURIComponent(prefix)}&per_page=5`,
            { headers, cache: "no-store" },
          );
          if (prefixRes.ok) {
            const prefixData = await prefixRes.json();
            if (Array.isArray(prefixData.items)) {
              for (const u of prefixData.items) {
                addUser(u);
              }
            }
          }
        } catch {
          // Bỏ qua fallback
        }
      }
    }

    // 5. Kiểm tra trạng thái collaborator nếu có owner và repo
    let existingCollabs = new Set<string>();
    if (owner && repo && userMap.size > 0) {
      try {
        const collabRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/collaborators?per_page=100`,
          { headers, cache: "no-store" },
        );
        if (collabRes.ok) {
          const collabs = await collabRes.json();
          if (Array.isArray(collabs)) {
            existingCollabs = new Set(
              collabs.map((c: any) => c.login?.toLowerCase()),
            );
          }
        }
      } catch {
        // Bỏ qua nếu user không đủ quyền admin để list collaborators
      }
    }

    const users = Array.from(userMap.values()).map((u) => ({
      ...u,
      isCollaborator: existingCollabs.has(u.login.toLowerCase()),
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi xử lý tìm kiếm thành viên" },
      { status: 500 },
    );
  }
}
