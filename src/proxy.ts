import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api/admin') ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/:path*'] };
