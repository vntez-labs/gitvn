import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { attachAuthCookiesToResponse, setAuthCookies } from "@/lib/auth-token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "GitVN-App",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || tokenData.error },
        { status: 400 },
      );
    }

    // 1. Tạo redirect response
    const redirectUrl = new URL("/dashboard", request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 2. GẮN TRỰC TIẾP Set-Cookie vào Redirect Response (Bắt buộc để trình duyệt nhận cookie)
    attachAuthCookiesToResponse(response, tokenData, request.url);

    // 3. Đồng thời lưu vào cookieStore cho server-side context
    const isLocalhost =
      request.url.includes("localhost") || request.url.includes("127.0.0.1");
    const isSecure = process.env.NODE_ENV === "production" && !isLocalhost;
    const cookieStore = await cookies();
    await setAuthCookies(cookieStore, tokenData, isSecure);

    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
