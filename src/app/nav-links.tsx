"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 text-sm font-medium">
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              isActive ? "bg-accent-600 text-white" : "text-neutral-600 hover:bg-accent-50 hover:text-accent-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
