import { auth } from "@/auth";
import { NextResponse } from "next/server";

const roleHome = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  patient: "/patient/prescriptions",
  receptionist: "/receptionist/appointments",
};

const roleRootPrefix = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
  receptionist: "/receptionist",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isApiRoute = pathname.startsWith("/api/");
  const isAuthPage = pathname.startsWith("/login");
  const isPublicPage = pathname === "/" || pathname.startsWith("/verify");

  if (isApiRoute) {
    // API routes check auth/authorization themselves; a redirect here
    // would turn a PDF download into a broken login-page response.
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

  const allowedPrefix = roleRootPrefix[session.user.role];
  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(roleHome[session.user.role], req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
