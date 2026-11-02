import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));

  // Xóa trực tiếp trên response để đính kèm header Set-Cookie Max-Age=0
  response.cookies.set("github_access_token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
