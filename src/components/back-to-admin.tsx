import Link from "next/link";

export function BackToAdmin() {
  return (
    <Link
      href="/admin"
      className="shrink-0 whitespace-nowrap rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-accent-300 hover:text-accent-700"
    >
      ← Back to Admin
    </Link>
  );
}
