import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to decode JWT token (simple base64 decode for user role)
function getUserRoleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  
  try {
    // Token auth stores user_id, not JWT, so we need to check localStorage on client
    // For middleware, we'll check cookie and let client-side handle role validation
    // This is a limitation - ideally we'd decode the token or make an API call
    return null; // Will be handled client-side
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const pathname = req.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/chefs', '/discover', '/meals'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  
  // Check if this is an auth route (login, register, or /auth)
  const isAuthRoute = 
    pathname === '/auth' || 
    pathname === '/login' || 
    pathname === '/register' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/register/');

  // Allow public routes and static files
  if (isPublicRoute || pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // If no token and trying to access protected routes, redirect to auth
  if (!token && !isAuthRoute && !isPublicRoute) {
    const redirectUrl = new URL('/auth', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If token exists and trying to access auth routes, redirect based on role
  // Note: Role check happens client-side, middleware just redirects to default
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/client/home', req.url));
  }

  // Role-based route protection (basic check - full validation client-side)
  if (token) {
    // Client routes - allow if token exists (role check in component)
    if (pathname.startsWith('/client/')) {
      return NextResponse.next();
    }
    
    // Chef routes - allow if token exists (role check in component)
    if (pathname.startsWith('/chef/')) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/client/:path*',
    '/chef/:path*',
    '/auth/:path*',
    '/login/:path*',
    '/register/:path*',
    '/login',
    '/register',
    '/profile/:path*',
    '/orders/:path*',
    '/bookings/:path*',
  ],
};
