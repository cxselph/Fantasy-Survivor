"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, createUserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { generateToken, hashToken, INVITE_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendEmail } from "@/lib/email/send-email";
import { inviteEmail } from "@/lib/email/templates";
import { normalizeEmail, appUrl } from "@/lib/users";

export type InviteUserState = { error?: string; success?: string };

export async function inviteUser(
  _prevState: InviteUserState | undefined,
  formData: FormData,
): Promise<InviteUserState> {
  await requireAdmin();

  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "").trim();
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";
  const teamIdRaw = String(formData.get("teamId") || "");
  const teamId = teamIdRaw ? Number(teamIdRaw) : null;

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!name) {
    return { error: "Enter a name." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { error: `${email} already has an account.` };
  }

  const rawToken = generateToken();
  const inviteTokenHash = hashToken(rawToken);
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name, role, inviteTokenHash, inviteTokenExpiresAt },
      })
    : await prisma.user.create({
        data: { email, name, role, inviteTokenHash, inviteTokenExpiresAt },
      });

  if (teamId) {
    await prisma.fantasyTeam.update({ where: { id: teamId }, data: { userId: user.id } });
  }

  const acceptUrl = `${appUrl()}/accept-invite?token=${rawToken}`;
  await sendEmail({ to: email, ...inviteEmail({ name, acceptUrl }) });

  revalidatePath("/admin/users");
  return { success: `Invite sent to ${email}.` };
}

export async function resendInvite(userId: number) {
  await requireAdmin();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.passwordHash) return; // already accepted, nothing to resend

  const rawToken = generateToken();
  const inviteTokenHash = hashToken(rawToken);
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
  await prisma.user.update({ where: { id: userId }, data: { inviteTokenHash, inviteTokenExpiresAt } });

  const acceptUrl = `${appUrl()}/accept-invite?token=${rawToken}`;
  await sendEmail({ to: user.email, ...inviteEmail({ name: user.name, acceptUrl }) });
  revalidatePath("/admin/users");
}

export type AcceptInviteState = { error?: string };

export async function acceptInvite(
  _prevState: AcceptInviteState | undefined,
  formData: FormData,
): Promise<AcceptInviteState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) return { error: "This link is invalid or has expired." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const tokenHash = hashToken(token);
  const user = await prisma.user.findUnique({ where: { inviteTokenHash: tokenHash } });
  if (!user || !user.inviteTokenExpiresAt || user.inviteTokenExpiresAt < new Date()) {
    return { error: "This link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(password);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, inviteTokenHash: null, inviteTokenExpiresAt: null },
  });

  await createUserSession({
    userId: updated.id,
    role: updated.role === "ADMIN" ? "admin" : "member",
    sessionVersion: updated.sessionVersion,
  });
  redirect("/");
}
