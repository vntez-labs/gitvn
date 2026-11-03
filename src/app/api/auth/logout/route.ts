import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  const isLocalhost =
    request.url.includes("localhost") || request.url.includes("127.0.0.1");
  const isProd = process.env.NODE_ENV === "production" && !isLocalhost;
  const opts = { path: "/", maxAge: 0, httpOnly: true, secure: isProd };

  // Xóa trực tiếp trên response để đính kèm header Set-Cookie Max-Age=0
  response.cookies.set("github_access_token", "", opts);
  response.cookies.set("github_refresh_token", "", opts);
  response.cookies.set("github_token_expires_at", "", opts);

  return response;
}
