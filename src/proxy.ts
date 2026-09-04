import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth";

// Fast, DB-free coarse gate: verifies the JWT signature and its role claim only. The
// authoritative check (does this user still exist, is it locked, has sessionVersion changed)
// happens in getSession() at the page/action level - this just keeps fully unauthenticated
// visitors out and pre-filters /admin/* before a request even reaches a page.
async function readRole(token: string | undefined): Promise<"admin" | "member" | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "admin" ? "admin" : payload.role === "member" ? "member" : null;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ["/login", "/setup", "/accept-invite", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const role = await readRole(request.cookies.get(SESSION_COOKIE)?.value);

  if (!role) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
