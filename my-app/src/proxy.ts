import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "@/server/auth";

/**
 * Runs before protected page requests. In Next.js 16 this convention replaces
 * the deprecated `middleware.ts` entry point.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (await hasValidSession(request)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/entry/:path*", "/settings/:path*"],
};
