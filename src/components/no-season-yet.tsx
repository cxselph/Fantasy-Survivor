import Link from "next/link";

export function NoSeasonYet({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-2xl bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
      <h1 className="font-display mb-2 text-2xl tracking-wide text-neutral-900">No Season Yet</h1>
      <p className="text-sm text-neutral-500">
        {isAdmin ? (
          <>
            Create a season in{" "}
            <Link href="/admin/seasons" className="font-medium text-accent-600 underline">
              Manage Seasons
            </Link>{" "}
            and activate it to get started.
          </>
        ) : (
          "No admin has set up a season yet — check back soon."
        )}
      </p>
    </div>
  );
}
