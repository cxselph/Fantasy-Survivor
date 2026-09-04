import { requireAdmin } from "@/lib/auth";
import { getAllSeasons } from "@/lib/scoring";
import { CreateSeasonForm } from "./create-season-form";
import { SeasonRow } from "./season-row";
import { BackToAdmin } from "@/components/back-to-admin";

export default async function AdminSeasonsPage() {
  await requireAdmin();
  const seasons = await getAllSeasons();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Manage Seasons</h1>
        <BackToAdmin />
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Seasons</h2>
        <div className="flex flex-col gap-2">
          {seasons.map((season) => (
            <SeasonRow key={season.id} season={season} />
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
