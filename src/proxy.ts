import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

const PROTECTED = ["/news", "/topic", "/search", "/inbox", "/settings", "/onboarding"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (AUTH_PAGES.includes(pathname) && userId) {
    return NextResponse.redirect(new URL("/news", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg|logo.svg|illustrations).*)"],
};
