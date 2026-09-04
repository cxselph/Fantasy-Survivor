import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { getActiveSeason, getSiteTitle } from "@/lib/scoring";
import { generateAccentShades } from "@/lib/theme";
import { NavLinks } from "./nav-links";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fantasy Survivor League",
  description: "Season 51 fantasy league dashboard",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/cast", label: "Cast" },
  { href: "/join", label: "My Team" },
  { href: "/rules", label: "Rules" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  let siteTitle = "🔥 Survivor League";
  let backgroundUrl: string | null = null;
  let backgroundDim = 45;
  let accentColor: string | null = null;
  try {
    const season = await getActiveSeason();
    siteTitle = getSiteTitle(season);
    backgroundUrl = season.backgroundUrl;
    backgroundDim = season.backgroundDim;
    accentColor = season.accentColor;
  } catch {
    // No season configured yet - fall back to defaults.
  }

  const navLinks = session?.role === "admin" ? [...NAV_LINKS, { href: "/admin", label: "Admin" }] : NAV_LINKS;

  const accentShades = generateAccentShades(accentColor);
  const accentStyle = Object.fromEntries(
    Object.entries(accentShades).map(([shade, hex]) => [`--accent-${shade}`, hex]),
  ) as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
      style={accentStyle}
    >
      <body
        className={`min-h-full flex flex-col text-neutral-900 ${backgroundUrl ? "" : "bg-tropical"}`}
        style={
          backgroundUrl
            ? {
                backgroundImage: `linear-gradient(rgba(8,20,30,${backgroundDim / 100}), rgba(8,20,30,${backgroundDim / 100})), url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
              }
            : undefined
        }
      >
        {session && (
          <header className="sticky top-0 z-10 border-b border-white/20 bg-white/85 shadow-sm backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-display text-xl tracking-wide text-accent-600">{siteTitle}</span>
                <NavLinks links={navLinks} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-500">{session.name}</span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-sm text-neutral-400 hover:text-neutral-700"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </header>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
