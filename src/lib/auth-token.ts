import { cookies } from "next/headers";

export interface GitHubTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/**
 * Lưu toàn bộ token và thời gian hết hạn vào HTTP-Only Cookies an toàn
 */
export async function setAuthCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  tokenData: GitHubTokenResponse,
) {
  const isProd = process.env.NODE_ENV === "production";
  const accessMaxAge = tokenData.expires_in || 60 * 60 * 24 * 30; // 30 ngày nếu không có expires_in
  const refreshMaxAge =
    tokenData.refresh_token_expires_in || 60 * 60 * 24 * 180; // 6 tháng

  // 1. Lưu Access Token
  cookieStore.set("github_access_token", tokenData.access_token, {
    httpOnly: true,
    secure: isProd,
    path: "/",
    maxAge: accessMaxAge,
    sameSite: "lax",
  });

  // 2. Lưu Refresh Token nếu GitHub App có cấp (Expiring User Tokens)
  if (tokenData.refresh_token) {
    cookieStore.set("github_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: isProd,
      path: "/",
      maxAge: refreshMaxAge,
      sameSite: "lax",
    });
  }

  // 3. Lưu mốc thời gian hết hạn (Timestamp ms) để kiểm tra chủ động
  if (tokenData.expires_in) {
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    cookieStore.set("github_token_expires_at", String(expiresAt), {
      httpOnly: true,
      secure: isProd,
      path: "/",
      maxAge: refreshMaxAge,
      sameSite: "lax",
    });
  }
}

/**
 * Xóa sạch toàn bộ cookie xác thực khi đăng xuất hoặc token bị thu hồi
 */
export async function clearAuthCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const isProd = process.env.NODE_ENV === "production";
  const opts = { path: "/", maxAge: 0, httpOnly: true, secure: isProd };

  cookieStore.set("github_access_token", "", opts);
  cookieStore.set("github_refresh_token", "", opts);
  cookieStore.set("github_token_expires_at", "", opts);
}

/**
 * Gọi GitHub OAuth API để làm mới Access Token bằng Refresh Token
 */
export async function refreshGitHubToken(
  refreshToken: string,
): Promise<{ ok: boolean; data?: GitHubTokenResponse; error?: string }> {
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "GitVN-App",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });

    const data: GitHubTokenResponse = await res.json();
    if (data.error || !data.access_token) {
      console.error(
        "[GitHub Token Refresh Failed]:",
        data.error_description || data.error,
      );
      return { ok: false, error: data.error_description || data.error };
    }

    return { ok: true, data };
  } catch (err: any) {
    console.error("[GitHub Token Refresh Exception]:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Lấy Access Token còn hạn sử dụng. Nếu token đã hết hạn hoặc sắp hết hạn (< 2 phút),
 * hệ thống sẽ TỰ ĐỘNG dùng refresh_token để gia hạn và cập nhật lại cookie.
 */
export async function getValidAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("github_access_token")?.value;
  const refreshToken = cookieStore.get("github_refresh_token")?.value;
  const expiresAtStr = cookieStore.get("github_token_expires_at")?.value;
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

  // Trường hợp 1: Có access token và còn hạn trên 2 phút (hoặc không có mốc expires_at)
  const isTokenFresh =
    accessToken && (!expiresAt || expiresAt - Date.now() > 2 * 60 * 1000);

  if (isTokenFresh) {
    return accessToken;
  }

  // Trường hợp 2: Token đã hết hạn / sắp hết hạn, nhưng có Refresh Token -> Tự động gia hạn
  if (refreshToken) {
    console.log(
      "[Auth] Access token hết hạn hoặc sắp hết, đang tự động refresh...",
    );
    const refreshResult = await refreshGitHubToken(refreshToken);
    if (refreshResult.ok && refreshResult.data) {
      await setAuthCookies(cookieStore, refreshResult.data);
      console.log("[Auth] Tự động refresh token thành công!");
      return refreshResult.data.access_token;
    }

    // Nếu refresh token bị hỏng hoặc bị revoke trên GitHub -> Xóa sạch cookies
    console.warn("[Auth] Refresh token không còn hợp lệ, xóa phiên đăng nhập.");
    await clearAuthCookies(cookieStore);
    return null;
  }

  // Trường hợp 3: Không có refresh token, trả về access token hiện tại nếu có
  return accessToken || null;
}

/**
 * Fetch helper có đính kèm Authorization và tự động retry nếu nhận mã 401
 */
export async function fetchGitHubWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  let token = await getValidAuthToken();

  const makeRequest = (t: string | null) => {
    const headers = new Headers(init.headers || {});
    if (t) {
      headers.set("Authorization", `Bearer ${t}`);
    }
    if (!headers.has("User-Agent")) {
      headers.set("User-Agent", "GitVN-App");
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/vnd.github+json");
    }
    if (!headers.has("X-GitHub-Api-Version")) {
      headers.set("X-GitHub-Api-Version", "2022-11-28");
    }
    return fetch(url, { ...init, headers });
  };

  let res = await makeRequest(token);

  // Nếu gặp 401 Unauthorized và có refresh token, thử refresh ngay lập tức và retry 1 lần
  if (res.status === 401) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("github_refresh_token")?.value;
    if (refreshToken) {
      console.log(
        "[Auth 401] Bắt gặp 401, đang thử refresh token và thử lại...",
      );
      const refreshRes = await refreshGitHubToken(refreshToken);
      if (refreshRes.ok && refreshRes.data) {
        await setAuthCookies(cookieStore, refreshRes.data);
        token = refreshRes.data.access_token;
        res = await makeRequest(token);
      }
    }
  }

  return res;
}
