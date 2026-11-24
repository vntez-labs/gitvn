import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeWorkspaceDestination } from "@/lib/workspace-links";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("github_access_token")?.value;
  const { pathname, search } = request.nextUrl;

  if (token) return NextResponse.next();
  const workspace = safeWorkspaceDestination(pathname + search);
  if (!workspace) return NextResponse.redirect(new URL("/", request.url));

  const signIn = new URL("/api/integrations/github", request.url);
  signIn.searchParams.set("workspace", workspace);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: "/dashboard/:path*",
};
