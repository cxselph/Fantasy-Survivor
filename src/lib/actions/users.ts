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

export type UpdateInviteState = { error?: string; success?: string };

// Edits a still-pending invite's email/name/role (e.g. fixing a typo'd address) and always
// regenerates + resends the invite token - submitting with nothing changed is just a resend.
// Editing in place (rather than delete-and-recreate) keeps any FantasyTeam.userId link intact,
// since that's tied to the User row's id, not its email.
export async function updateInvite(
  _prevState: UpdateInviteState | undefined,
  formData: FormData,
): Promise<UpdateInviteState> {
  await requireAdmin();

  const userId = Number(formData.get("userId"));
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "").trim();
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!Number.isInteger(userId)) return { error: "Invalid user." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (!name) return { error: "Enter a name." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.passwordHash) {
    return { error: "This account has already been claimed and can no longer be edited here." };
  }

  if (email !== user.email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== userId) {
      return { error: `${email} is already in use by another account.` };
    }
  }

  const rawToken = generateToken();
  const inviteTokenHash = hashToken(rawToken);
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: { email, name, role, inviteTokenHash, inviteTokenExpiresAt },
  });

  const acceptUrl = `${appUrl()}/accept-invite?token=${rawToken}`;
  await sendEmail({ to: email, ...inviteEmail({ name, acceptUrl }) });

  revalidatePath("/admin/users");
  return { success: `Invite updated and resent to ${email}.` };
}

export async function unlockUser(userId: number) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
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
