import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeWorkspaceDestination } from "@/lib/workspace-links";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("github_access_token")?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/",
    "/login",
    "/share/",
    "/favicon.ico",
    "/icon.svg",
    "/apple-icon.svg",
    "/opengraph-image",
    "/og-image.png",
    "/robots.txt",
    "/sitemap.xml",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );

  // 2. XỬ LÝ TRANG CHỦ (/)
  // Nếu đang ở trang chủ ('/') VÀ đã có token -> Đá thẳng vào /dashboard
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute && !token) {
    const workspace = safeWorkspaceDestination(
      pathname + request.nextUrl.search,
    );
    if (workspace) {
      const signIn = new URL("/api/integrations/github", request.url);
      signIn.searchParams.set("workspace", workspace);
      return NextResponse.redirect(signIn);
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua các API, static files,... không cần chạy qua proxy
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
