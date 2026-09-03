import { requireAdmin } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { deleteTribe } from "@/lib/actions/cast";
import { TribeSelect } from "./tribe-select";
import { EliminationToggle } from "./elimination-toggle";
import { EditCastawayForm } from "./edit-castaway-form";
import { AddTribeForm, AddCastawayForm } from "./add-forms";

export default async function AdminCastPage() {
  await requireAdmin();
  const season = await getActiveSeason();

  const [tribes, castaways] = await Promise.all([
    prisma.tribe.findMany({ where: { seasonId: season.id }, orderBy: { name: "asc" } }),
    prisma.castaway.findMany({
      where: { seasonId: season.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Manage Cast &amp; Tribes</h1>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Tribes</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {tribes.map((tribe) => (
            <div
              key={tribe.id}
              className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-white"
              style={{ backgroundColor: tribe.color }}
            >
              {tribe.name}
              <form action={deleteTribe}>
                <input type="hidden" name="tribeId" value={tribe.id} />
                <button type="submit" className="opacity-70 hover:opacity-100">
                  ✕
                </button>
              </form>
            </div>
          ))}
          {tribes.length === 0 && <span className="text-sm text-neutral-500">No tribes yet.</span>}
        </div>
        <AddTribeForm />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Castaways ({castaways.length})</h2>
        <div className="flex flex-col gap-2">
          {castaways.map((castaway) => (
            <details key={castaway.id} className="rounded-md border border-neutral-200 p-2">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  {castaway.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={castaway.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-500">
                      {castaway.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                  {castaway.name}
                </span>
                <div className="flex items-center gap-3">
                  <TribeSelect castawayId={castaway.id} tribeId={castaway.tribeId} tribes={tribes} />
                  <EliminationToggle
                    castawayId={castaway.id}
                    isEliminated={castaway.isEliminated}
                    eliminatedWeek={castaway.eliminatedWeek}
                  />
                </div>
              </summary>
              <EditCastawayForm castaway={castaway} />
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Add Castaway</h2>
        <AddCastawayForm />
      </section>
    </div>
  );
}
