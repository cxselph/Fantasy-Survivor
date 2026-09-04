import Link from "next/link";
import { getActiveSeason, getSiteTitle } from "@/lib/scoring";
import { hasRealAdmin } from "@/lib/actions/bootstrap";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  let bannerUrl: string | null = null;
  let siteTitle = "🔥 Survivor League";
  try {
    const season = await getActiveSeason();
    bannerUrl = season.bannerUrl;
    siteTitle = getSiteTitle(season);
  } catch {
    // No season configured yet - just skip the banner and use a generic title.
  }

  const showSetupLink = !(await hasRealAdmin());

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="Season banner" className="mb-5 w-full rounded-xl object-cover shadow-md" />
        )}
        <h1 className="font-display mb-1 text-center text-3xl tracking-wide text-orange-600">{siteTitle}</h1>
        <p className="mb-6 text-center text-sm text-neutral-500">Log in with your email and password.</p>
        <LoginForm next={next ?? "/"} />
        {showSetupLink && (
          <p className="mt-4 text-center text-sm text-neutral-500">
            First time setting this up?{" "}
            <Link href="/setup" className="font-medium text-orange-600 underline">
              Set up the admin account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
