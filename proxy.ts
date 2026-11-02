import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('github_access_token')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/login', '/favicon.ico'];

  const isPublicRoute = publicRoutes.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  // 2. XỬ LÝ TRANG CHỦ (/)
  // Nếu đang ở trang chủ ('/') VÀ đã có token -> Đá thẳng vào /dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Bỏ qua các API, static files,... không cần chạy qua proxy
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
