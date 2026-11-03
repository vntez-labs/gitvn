import { type NextRequest, NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reconnect = searchParams.get("reconnect") === "true";

  // Nếu đã đăng nhập với token hợp lệ (hoặc vừa được auto-refresh thành công), chuyển thẳng vào Dashboard
  if (!reconnect) {
    const validToken = await getValidAuthToken();
    if (validToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Tự động xác định origin động thay vì hardcode localhost:3000
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/api/integrations/github/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || "",
    redirect_uri: redirectUri,
    scope: "repo read:org read:user user:email",
  });

  if (reconnect) {
    params.set("prompt", "consent");
  }

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
}
