import { getActiveSeason, getSiteTitle } from "@/lib/scoring";
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      {bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="Season banner" className="mb-4 w-full rounded-lg object-cover" />
      )}
      <h1 className="mb-1 text-center text-2xl font-bold text-orange-600">{siteTitle}</h1>
      <p className="mb-6 text-center text-sm text-neutral-500">
        Enter the league password to get in.
      </p>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
