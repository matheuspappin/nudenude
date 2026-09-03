import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Supabase default cookie name prefix is often 'sb-'
  const hasSupabaseToken = req.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                           req.nextUrl.pathname.startsWith('/settings');

  if (isProtectedRoute && !hasSupabaseToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
