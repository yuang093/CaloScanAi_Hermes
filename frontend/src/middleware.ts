import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要登入才能訪問的路徑
const PROTECTED_PATHS = ['/dashboard', '/api/user'];

// 登入/註冊頁面（已登入則跳過）
const AUTH_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 讀取 auth_token cookie
  const token = request.cookies.get('auth_token')?.value;

  // 1. 已登入但訪問 auth 頁面 → 跳回首頁或 dashboard
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. 訪問受保護路徑但無 token → 跳回登入
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路徑除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};