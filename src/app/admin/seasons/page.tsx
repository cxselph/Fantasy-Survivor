import { requireAdmin } from "@/lib/auth";
import { getAllSeasons } from "@/lib/scoring";
import { activateSeason } from "@/lib/actions/season";
import { CreateSeasonForm } from "./create-season-form";

export default async function AdminSeasonsPage() {
  await requireAdmin();
  const seasons = await getAllSeasons();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Manage Seasons</h1>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Seasons</h2>
        <div className="flex flex-col gap-2">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">
                  Season {season.number}: {season.name}
                </span>
                {season.isActive && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Current
                  </span>
                )}
              </div>
              {!season.isActive && (
                <form action={activateSeason.bind(null, season.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-orange-300 hover:text-orange-700"
                  >
                    Make this the current season
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Create a New Season</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Creates an empty season (no cast yet, default scoring rules). It won&apos;t switch anyone
          over until you click &quot;Make this the current season&quot; above - at that point everyone
          sees it immediately, so activate it and then go straight to &quot;Manage Cast &amp; Tribes&quot;
          to add its castaways.
        </p>
        <CreateSeasonForm />
      </section>
    </div>
  );
}
