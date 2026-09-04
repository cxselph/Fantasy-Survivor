"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { generateToken, hashToken, RESET_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendEmail } from "@/lib/email/send-email";
import { passwordResetEmail } from "@/lib/email/templates";
import { normalizeEmail, appUrl } from "@/lib/users";

const GENERIC_SUCCESS = "If an account exists for that email, a reset link has been sent.";

export type RequestResetState = { error?: string; success?: string };

export async function requestPasswordReset(
  _prevState: RequestResetState | undefined,
  formData: FormData,
): Promise<RequestResetState> {
  const email = normalizeEmail(String(formData.get("email") || ""));
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Same response whether or not an account exists (or has accepted its invite yet) - this
  // can't be used to enumerate accounts. Only an already-active account gets an actual email.
  if (user?.passwordHash) {
    const rawToken = generateToken();
    const resetTokenHash = hashToken(rawToken);
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await prisma.user.update({ where: { id: user.id }, data: { resetTokenHash, resetTokenExpiresAt } });

    const resetUrl = `${appUrl()}/reset-password?token=${rawToken}`;
    await sendEmail({ to: user.email, ...passwordResetEmail({ name: user.name, resetUrl }) });
  }

  return { success: GENERIC_SUCCESS };
}

export type ResetPasswordState = { error?: string };

export async function resetPassword(
  _prevState: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) return { error: "This link is invalid or has expired." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const tokenHash = hashToken(token);
  const user = await prisma.user.findUnique({ where: { resetTokenHash: tokenHash } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "This link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(password);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      // A reset is also a clean slate: bump sessionVersion so any stolen/stale session dies
      // immediately, and clear any lockout since a forgotten password is often the reason for one.
      sessionVersion: { increment: 1 },
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await createUserSession({
    userId: updated.id,
    role: updated.role === "ADMIN" ? "admin" : "member",
    sessionVersion: updated.sessionVersion,
  });
  redirect("/");
}
