import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isPublicUserRoute = pathname === '/login' || pathname === '/register' || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  // If user tries to access /complete-profile without a token, redirect to /login
  if (pathname === '/complete-profile' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user has a token and tries to access /login or /register, let client-side router navigate to their specific dashboard
  // Only auto-redirect to /dashboard if NOT change-password or complete-profile
  if (token && isPublicUserRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user tries to access any admin page (including /admin/login) with a token,
  // let the page component handle the logic. The AdminLoginPage will redirect to the dashboard if the token is valid for an admin.
  if (pathname.startsWith('/admin') && token) {
      return NextResponse.next();
  }

  // If the user tries to access any admin page (except the login page itself) without a token,
  // redirect them to the admin login page.
  if (pathname.startsWith('/admin') && !token && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Define protected user routes
  const protectedUserRoutes = ['/dashboard', '/profile', '/ideas', '/resources'];
  const isProtectedRoute = protectedUserRoutes.some(path => pathname.startsWith(path));

  // If the user tries to access a protected user route without a token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Config to specify which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - coding-background.jpg (background image)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|coding-background.jpg).*)',
  ],
};