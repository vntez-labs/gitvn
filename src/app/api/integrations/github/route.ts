import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reconnect = searchParams.get("reconnect") === "true";

  // Nếu đã đăng nhập và không yêu cầu kết nối lại, chuyển thẳng vào Dashboard
  if (!reconnect) {
    const cookieStore = await cookies();
    const token = cookieStore.get("github_access_token")?.value;
    if (token) {
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
