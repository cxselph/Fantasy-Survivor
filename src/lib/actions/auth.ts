"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUserSession, destroySession } from "@/lib/auth";
import { verifyPassword, DUMMY_HASH } from "@/lib/password";
import { normalizeEmail } from "@/lib/users";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type LoginState = { error?: string };

const GENERIC_ERROR = "Incorrect email or password.";

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");
  const safeNext = next.startsWith("/") ? next : "/";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    // No account (or invite not yet accepted) - run a dummy hash comparison anyway so response
    // timing doesn't reveal whether the email exists.
    await verifyPassword(password, DUMMY_HASH);
    return { error: GENERIC_ERROR };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    // Don't extend lockedUntil once already locked - repeated attempts against a locked account
    // shouldn't be able to perma-lock it further.
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const justLocked = failedLoginAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts,
        ...(justLocked ? { lockedUntil: new Date(Date.now() + LOCKOUT_MS) } : {}),
      },
    });
    if (justLocked) {
      const minutesLeft = Math.ceil(LOCKOUT_MS / 60000);
      return { error: `Too many failed attempts. Try again in ${minutesLeft} minutes.` };
    }
    return { error: GENERIC_ERROR };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  await createUserSession({
    userId: user.id,
    role: user.role === "ADMIN" ? "admin" : "member",
    sessionVersion: user.sessionVersion,
  });
  redirect(safeNext);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
