import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { session, response } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const authPaths = ["/login", "/signup", "/reset-password"];
  const protectedPaths = ["/dashboard", "/settings", "/onboarding"];

  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
  const isProtectedPage = protectedPaths.some((p) => pathname.startsWith(p));

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPage && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
