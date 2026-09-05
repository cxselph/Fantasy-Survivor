"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, createUserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { generateToken, hashToken, INVITE_TOKEN_TTL_MS, RESET_TOKEN_TTL_MS } from "@/lib/tokens";
import { sendEmail, type SendEmailResult } from "@/lib/email/send-email";
import { inviteEmail } from "@/lib/email/templates";
import { normalizeEmail, appUrl } from "@/lib/users";

export type InviteUserState = { error?: string; success?: string };

// Persists the outcome of an invite email send onto the User row (surfaced as a badge in Manage
// Users) and turns it into the form state message - a failed/skipped send is still reported to
// the admin even though the invite itself (token + DB row) was already saved either way.
async function recordInviteEmailResult(userId: number, email: string, verb: string, result: SendEmailResult) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastInviteEmailStatus:
        result.status === "sent" ? "SENT" : result.status === "failed" ? "FAILED" : "NOT_CONFIGURED",
      lastInviteEmailError: result.status === "failed" ? result.error : null,
      lastInviteEmailAt: new Date(),
    },
  });

  if (result.status === "sent") return { success: `Invite ${verb} to ${email}.` };
  if (result.status === "not_configured") {
    return {
      error: `Invite saved for ${email}, but SMTP isn't configured yet — no email was sent. Set it up in Admin → Email Settings.`,
    };
  }
  return { error: `Invite saved for ${email}, but the email failed to send: ${result.error}` };
}

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
  const result = await sendEmail({ to: email, ...inviteEmail({ name, acceptUrl }) });

  revalidatePath("/admin/users");
  return recordInviteEmailResult(user.id, email, "sent", result);
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
  const result = await sendEmail({ to: email, ...inviteEmail({ name, acceptUrl }) });

  revalidatePath("/admin/users");
  return recordInviteEmailResult(userId, email, "updated and resent", result);
}

export type SetPasswordState = { error?: string; success?: string };

// Lets an admin directly set (or overwrite) a user's password, bypassing the email/token step
// entirely - the only recovery path for someone who can't receive email at all. On a still-
// pending invite this activates the account outright (nothing left to click); on an active
// account it's the same effect as a self-service reset, just admin-initiated.
export async function setUserPassword(
  _prevState: SetPasswordState | undefined,
  formData: FormData,
): Promise<SetPasswordState> {
  await requireAdmin();

  const userId = Number(formData.get("userId"));
  const password = String(formData.get("password") || "");
  if (!Number.isInteger(userId)) return { error: "Invalid user." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
      sessionVersion: { increment: 1 },
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  revalidatePath("/admin/users");
  return { success: "Password set." };
}

export type LinkResult = { link?: string; error?: string };

// Generates a fresh invite/reset token exactly like the email-sending flows do, but returns the
// raw link instead of emailing it - for someone whose email genuinely isn't reaching them (see
// the invite email status badges) and needs the link handed to them some other way (text,
// in person, etc). Same token, same one-time-use/expiry semantics as the emailed link - this
// isn't a separate, less secure path, just a different delivery channel.

export async function createInviteLink(userId: number): Promise<LinkResult> {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.passwordHash) return { error: "This account has already been claimed." };

  const rawToken = generateToken();
  const inviteTokenHash = hashToken(rawToken);
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
  await prisma.user.update({ where: { id: userId }, data: { inviteTokenHash, inviteTokenExpiresAt } });

  return { link: `${appUrl()}/accept-invite?token=${rawToken}` };
}

export async function createPasswordResetLink(userId: number): Promise<LinkResult> {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (!user.passwordHash) return { error: 'This account hasn\'t been claimed yet - use "Copy invite link" instead.' };

  const rawToken = generateToken();
  const resetTokenHash = hashToken(rawToken);
  const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await prisma.user.update({ where: { id: userId }, data: { resetTokenHash, resetTokenExpiresAt } });

  return { link: `${appUrl()}/reset-password?token=${rawToken}` };
}

export async function unlockUser(userId: number) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  revalidatePath("/admin/users");
}

// Active admins other than `excludingUserId` - used to stop an action from leaving the league
// with zero admins able to log in and manage it.
async function countActiveAdmins(excludingUserId: number) {
  return prisma.user.count({
    where: { role: "ADMIN", passwordHash: { not: null }, disabledAt: null, id: { not: excludingUserId } },
  });
}

export type UpdateUserState = { error?: string; success?: string };

// Edits an already-active user's name/email/role. Unlike updateInvite, never touches the invite
// token or resends anything - the account already exists.
export async function updateUser(
  _prevState: UpdateUserState | undefined,
  formData: FormData,
): Promise<UpdateUserState> {
  await requireAdmin();

  const userId = Number(formData.get("userId"));
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "").trim();
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!Number.isInteger(userId)) return { error: "Invalid user." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (!name) return { error: "Enter a name." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) return { error: "User not found." };

  if (user.role === "ADMIN" && role === "MEMBER" && (await countActiveAdmins(userId)) === 0) {
    return { error: "Can't remove the last admin." };
  }

  if (email !== user.email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== userId) {
      return { error: `${email} is already in use by another account.` };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { name, email, role } });
  revalidatePath("/admin/users");
  return { success: "Saved." };
}

// Disabling/deleting the last active admin, or your own account, is blocked here as a backstop,
// but the Manage Users page already hides these actions in those cases so this shouldn't
// normally be reachable - see the isSelf/isLastAdmin checks in admin/users/page.tsx.

export async function disableUser(userId: number) {
  const session = await requireAdmin();
  if (userId === session.userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (user.role === "ADMIN" && (await countActiveAdmins(userId)) === 0) return;

  await prisma.user.update({
    where: { id: userId },
    data: { disabledAt: new Date(), sessionVersion: { increment: 1 } },
  });
  revalidatePath("/admin/users");
}

export async function enableUser(userId: number) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { disabledAt: null } });
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: number) {
  const session = await requireAdmin();
  if (userId === session.userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (user.role === "ADMIN" && user.passwordHash && (await countActiveAdmins(userId)) === 0) return;

  // FantasyTeam.userId is onDelete: SetNull - any drafted team becomes unclaimed, not deleted.
  await prisma.user.delete({ where: { id: userId } });
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
