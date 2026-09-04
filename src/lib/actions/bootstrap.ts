"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { normalizeEmail } from "@/lib/users";

// True once at least one admin has actually claimed their account (passwordHash set) - a
// pending invited admin doesn't count, since they can't log in yet either. Drives both the
// /setup bootstrap gate and (in the login rewrite) whether the legacy env-var passwords still
// mean anything.
export async function hasRealAdmin(): Promise<boolean> {
  const count = await prisma.user.count({ where: { role: "ADMIN", passwordHash: { not: null } } });
  return count > 0;
}

export type ClaimAdminState = { error?: string };

export async function claimAdmin(
  _prevState: ClaimAdminState | undefined,
  formData: FormData,
): Promise<ClaimAdminState> {
  if (await hasRealAdmin()) {
    return { error: "An admin account already exists. Log in instead." };
  }

  const adminPassword = String(formData.get("adminPassword") || "");
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return { error: "Incorrect setup password." };
  }
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!name) {
    return { error: "Enter a name." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const passwordHash = await hashPassword(password);

  // An invite may already exist for this email (e.g. someone pre-invited themselves as admin
  // before ever running setup) - claim that pending row instead of colliding with the unique
  // email constraint by creating a second one. An already-claimed account (passwordHash set)
  // is never touched here, admin or not - setup only ever creates the *first* admin.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { error: "An account already exists for that email." };
  }

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name, role: "ADMIN", passwordHash, inviteTokenHash: null, inviteTokenExpiresAt: null },
      })
    : await prisma.user.create({
        data: { email, name, role: "ADMIN", passwordHash },
      });

  await createUserSession({ userId: user.id, role: "admin", sessionVersion: user.sessionVersion });
  redirect("/admin");
}
