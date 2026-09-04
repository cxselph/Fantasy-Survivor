import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { getActiveSeason, getSiteTitle } from "@/lib/scoring";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  if (session) {
    try {
      siteTitle = getSiteTitle(await getActiveSeason());
    } catch {
      // No season configured yet - fall back to the generic title.
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {session && (
          <header className="border-b border-neutral-200 bg-white">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold tracking-tight text-orange-600">{siteTitle}</span>
                <nav className="flex flex-wrap gap-3 text-sm font-medium">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-neutral-600 hover:text-orange-600"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {session.role === "admin" && (
                    <Link href="/admin" className="text-neutral-600 hover:text-orange-600">
                      Admin
                    </Link>
                  )}
                </nav>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-neutral-400 hover:text-neutral-700"
                >
                  Log out
                </button>
              </form>
            </div>
          </header>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
