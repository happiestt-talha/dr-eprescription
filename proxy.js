import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ROLE_HOME as roleHome, ROLE_PREFIX as roleRootPrefix } from "@/lib/roles";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isApiRoute = pathname.startsWith("/api/");
  const isAuthPage = pathname.startsWith("/login");
  const isPublicPage = pathname === "/" || pathname.startsWith("/verify");
  const isAccountPage = pathname.startsWith("/account");
  const PASSWORD_PAGE = "/account/password";
  const mustChangePassword = Boolean(session?.user?.mustChangePassword);

  if (isApiRoute) {
    // API routes check auth/authorization themselves; a redirect here
    // would turn a PDF download into a broken login-page response.
    if (mustChangePassword && !pathname.startsWith("/api/auth")) {
      return NextResponse.json({ error: "Password change required" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (isPublicPage || isAuthPage) {
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL(roleHome[session.user.role] ?? "/login", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // A temporary password must be replaced before anything else.
  if (mustChangePassword && pathname !== PASSWORD_PAGE) {
    return NextResponse.redirect(new URL(PASSWORD_PAGE, req.url));
  }
  // Account pages (change password) are open to every role.
  if (isAccountPage) return NextResponse.next();

  const allowedPrefix = roleRootPrefix[session.user.role];
  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(roleHome[session.user.role], req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, apple-icon (app icons, generated without extensions)
     * - images and static files (.svg, .png, .jpg, .jpeg, .gif, .webp, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
