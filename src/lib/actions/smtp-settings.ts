"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/secret-cipher";
import { sendEmail } from "@/lib/email/send-email";

export async function getSmtpSettingsForDisplay() {
  const settings = await prisma.smtpSettings.findUnique({ where: { id: 1 } });

  let passwordNeedsResave = false;
  if (settings?.passwordCiphertext && settings.passwordIv && settings.passwordAuthTag) {
    try {
      decrypt({ data: settings.passwordCiphertext, iv: settings.passwordIv, authTag: settings.passwordAuthTag });
    } catch {
      passwordNeedsResave = true;
    }
  }

  return {
    host: settings?.host ?? "",
    port: settings?.port ?? 587,
    username: settings?.username ?? "",
    fromEmail: settings?.fromEmail ?? "",
    fromName: settings?.fromName ?? "Fantasy Survivor",
    hasPassword: !!settings?.passwordCiphertext,
    passwordNeedsResave,
  };
}

export type SmtpSettingsState = { error?: string; success?: string };

export async function updateSmtpSettings(
  _prevState: SmtpSettingsState | undefined,
  formData: FormData,
): Promise<SmtpSettingsState> {
  await requireAdmin();

  const host = String(formData.get("host") || "").trim();
  const portRaw = String(formData.get("port") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const fromEmail = String(formData.get("fromEmail") || "").trim();
  const fromName = String(formData.get("fromName") || "").trim() || "Fantasy Survivor";

  const port = portRaw ? Number(portRaw) : null;
  if (portRaw && (!Number.isInteger(port) || port! <= 0)) {
    return { error: "Port must be a positive number." };
  }

  const passwordFields = password
    ? (() => {
        const enc = encrypt(password);
        return { passwordCiphertext: enc.data, passwordIv: enc.iv, passwordAuthTag: enc.authTag };
      })()
    : {};

  await prisma.smtpSettings.upsert({
    where: { id: 1 },
    create: { id: 1, host, port, username, fromEmail, fromName, ...passwordFields },
    update: { host, port, username, fromEmail, fromName, ...passwordFields },
  });

  revalidatePath("/admin/email-settings");
  return { success: "Email settings saved." };
}

export type TestEmailState = { error?: string; success?: string };

export async function sendTestEmailAction(
  _prevState: TestEmailState | undefined,
  formData: FormData,
): Promise<TestEmailState> {
  await requireAdmin();

  const to = String(formData.get("to") || "").trim();
  if (!to || !to.includes("@")) {
    return { error: "Enter a valid email address to send the test to." };
  }

  try {
    await sendEmail({
      to,
      subject: "Test email",
      html: `<p>This is a test email from the Fantasy Survivor League site, sent ${new Date().toLocaleString()} to confirm SMTP delivery is working.</p>`,
      text: `This is a test email from the Fantasy Survivor League site, sent ${new Date().toLocaleString()} to confirm SMTP delivery is working.`,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send test email." };
  }

  return { success: `Test email sent to ${to} (or logged to the server console if SMTP isn't configured yet).` };
}
