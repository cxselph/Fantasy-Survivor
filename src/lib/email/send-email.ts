import nodemailer from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

// Provider-agnostic - SMTP2GO (or any other SMTP provider) is configured entirely via env vars,
// so swapping providers later never touches this function.
export async function sendEmail(message: EmailMessage): Promise<void> {
  const transport = getTransport();

  if (!transport) {
    // No SMTP configured (e.g. local dev) - log instead of sending so invite/reset flows are
    // still testable without real credentials.
    console.log(`[email] SMTP not configured, logging message instead:\n`, {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || "Fantasy Survivor League <no-reply@example.com>",
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
