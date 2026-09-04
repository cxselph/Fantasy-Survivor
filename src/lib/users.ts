export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}
