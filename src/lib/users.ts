export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Falls back through Vercel's own auto-injected URL vars so invite/reset links are never wrong
// on a deployment that never got an explicit APP_URL - VERCEL_PROJECT_PRODUCTION_URL is the
// stable production domain (VERCEL_URL on a production deploy is the per-deployment hash URL,
// not the alias), and VERCEL_URL on preview is that specific preview deployment's own URL.
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
