import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  refreshGitHubToken,
  setAuthCookies,
} from "@/lib/auth-token";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("github_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Không tìm thấy refresh token", needsReauth: true },
      { status: 401 },
    );
  }

  const res = await refreshGitHubToken(refreshToken);
  if (!res.ok || !res.data) {
    await clearAuthCookies(cookieStore);
    return NextResponse.json(
      {
        error: res.error || "Gia hạn token thất bại",
        needsReauth: true,
      },
      { status: 401 },
    );
  }

  await setAuthCookies(cookieStore, res.data);

  return NextResponse.json({
    success: true,
    message: "Đã làm mới access token thành công",
    expiresIn: res.data.expires_in,
  });
}

export async function GET() {
  return POST();
}
