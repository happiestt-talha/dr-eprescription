import { auth } from "@/auth";
import { NextResponse } from "next/server";

const roleHome = {
  admin: "/admin/dashboard",
  doctor: "/doctor/patients",
  patient: "/patient",
  receptionist: "/receptionist",
};

const rolePrefix = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
  receptionist: "/receptionist",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isAuthPage = pathname.startsWith("/login");
  const isPublicPage = pathname === "/" || pathname.startsWith("/verify");

  if (isPublicPage || isAuthPage) {
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL(roleHome[session.user.role] ?? "/login", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const allowedPrefix = rolePrefix[session.user.role];
  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(roleHome[session.user.role] ?? "/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|api/verify).*)"],
};
