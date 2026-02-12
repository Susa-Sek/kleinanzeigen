import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith('/auth/')
  );

  if (isPublicRoute) {
    return res;
  }

  // Check authentication for protected routes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Try to get the session from the request headers
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    // Redirect to login if not authenticated
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/accounts/:path*',
    '/api/messages/:path*',
    '/api/sync/:path*',
  ],
};
