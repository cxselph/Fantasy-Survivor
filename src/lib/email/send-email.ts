import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/secret-cipher";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function getSmtpConfig() {
  const settings = await prisma.smtpSettings.findUnique({ where: { id: 1 } });
  if (!settings?.host || !settings.username || !settings.passwordCiphertext || !settings.passwordIv || !settings.passwordAuthTag) {
    return null;
  }
  let password: string;
  try {
    password = decrypt({
      data: settings.passwordCiphertext,
      iv: settings.passwordIv,
      authTag: settings.passwordAuthTag,
    });
  } catch {
    // Saved password can't be decrypted with the current SETTINGS_ENCRYPTION_KEY (e.g. the key
    // changed since it was saved) - treat as unconfigured rather than throwing. Admin -> Email
    // Settings surfaces this so it can be re-saved, see getSmtpSettingsForDisplay().
    console.error("[email] Saved SMTP password could not be decrypted - re-save it in Admin -> Email Settings.");
    return null;
  }
  return {
    host: settings.host,
    port: settings.port || 587,
    username: settings.username,
    password,
    fromEmail: settings.fromEmail || settings.username,
    fromName: settings.fromName || "Fantasy Survivor",
  };
}

// SMTP config is admin-managed (Admin -> Email Settings), stored encrypted in the DB - see
// src/lib/actions/smtp-settings.ts. Swapping providers later (SMTP2GO, M365, etc.) is just a
// matter of what the admin types into that form; this function doesn't change.
export async function sendEmail(message: EmailMessage): Promise<void> {
  const config = await getSmtpConfig();

  if (!config) {
    // No SMTP configured yet (e.g. local dev, or before an admin has filled in Email Settings) -
    // log instead of sending so invite/reset flows are still testable.
    console.log(`[email] SMTP not configured, logging message instead:\n`, {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return;
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.username, pass: config.password },
  });

  await transport.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
