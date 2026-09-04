import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "fs_session";
export type Role = "admin" | "member";
export type Session = { userId: number; role: Role; name: string; email: string };

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createUserSession({
  userId,
  role,
  sessionVersion,
}: {
  userId: number;
  role: Role;
  sessionVersion: number;
}) {
  const token = await new SignJWT({ userId, role, sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// DB-aware: verifies the JWT signature, then re-checks the live User row so a lockout, role
// change, or password reset (sessionVersion bump) invalidates an outstanding session immediately
// rather than only blocking future logins. Costs one indexed PK lookup per authenticated request,
// judged worth it at this app's traffic/scale - see the plan doc for the tradeoff discussion.
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let userId: number;
  let sessionVersion: number;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId !== "number" || typeof payload.sessionVersion !== "number") return null;
    userId = payload.userId;
    sessionVersion = payload.sessionVersion;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.sessionVersion !== sessionVersion) return null;
  if (user.lockedUntil && user.lockedUntil > new Date()) return null;
  if (user.disabledAt) return null;

  return {
    userId: user.id,
    role: user.role === "ADMIN" ? "admin" : "member",
    name: user.name,
    email: user.email,
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");
  return session;
}
