import type { EmailMessage } from "./send-email";

function wrapper(title: string, bodyHtml: string, linkUrl: string, linkLabel: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #171717;">
      <h1 style="font-size: 20px; color: #ea580c;">${title}</h1>
      ${bodyHtml}
      <p style="margin: 24px 0;">
        <a href="${linkUrl}" style="background: #ea580c; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">${linkLabel}</a>
      </p>
      <p style="font-size: 12px; color: #737373;">If the button doesn't work, copy and paste this link: ${linkUrl}</p>
    </div>
  `;
}

export function inviteEmail({
  name,
  acceptUrl,
}: {
  name: string;
  acceptUrl: string;
}): Omit<EmailMessage, "to"> {
  return {
    subject: "You're invited to the Fantasy Survivor League",
    html: wrapper(
      "You're invited!",
      `<p>Hi ${name}, you've been invited to join the Fantasy Survivor League. Click below to set your password and get in.</p><p>This link expires in 7 days.</p>`,
      acceptUrl,
      "Accept invite",
    ),
    text: `Hi ${name}, you've been invited to join the Fantasy Survivor League. Set your password here (expires in 7 days): ${acceptUrl}`,
  };
}

export function passwordResetEmail({
  name,
  resetUrl,
}: {
  name: string;
  resetUrl: string;
}): Omit<EmailMessage, "to"> {
  return {
    subject: "Reset your Fantasy Survivor League password",
    html: wrapper(
      "Reset your password",
      `<p>Hi ${name}, we got a request to reset your password. Click below to choose a new one.</p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
      resetUrl,
      "Reset password",
    ),
    text: `Hi ${name}, reset your password here (expires in 1 hour): ${resetUrl}. If you didn't request this, ignore this email.`,
  };
}
