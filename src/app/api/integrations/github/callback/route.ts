import { type NextRequest, NextResponse } from "next/server";
import { attachAuthCookiesToResponse } from "@/lib/auth-token";
import {
  postLoginWorkspaceCookie,
  safeWorkspaceDestination,
} from "@/lib/workspace-links";

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
    const destination = safeWorkspaceDestination(
      request.cookies.get(postLoginWorkspaceCookie)?.value,
    );
    const redirectUrl = new URL(destination ?? "/dashboard", request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 2. GẮN TRỰC TIẾP Set-Cookie vào Redirect Response
    attachAuthCookiesToResponse(response, tokenData, request.url);

    response.cookies.set(postLoginWorkspaceCookie, "", {
      path: "/api/integrations/github/callback",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
