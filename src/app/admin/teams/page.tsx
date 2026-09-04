import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/scoring";
import { NoSeasonYet } from "@/components/no-season-yet";

export default async function AdminTeamsPage() {
  await requireAdmin();

  let season;
  try {
    season = await getActiveSeason();
  } catch {
    return <NoSeasonYet isAdmin={true} />;
  }

  const teams = await prisma.fantasyTeam.findMany({
    where: { seasonId: season.id },
    include: { user: true },
    orderBy: { ownerName: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Manage Teams — Season {season.number}</h1>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        {teams.length === 0 ? (
          <p className="text-sm text-neutral-500">No teams drafted yet this season.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2 pr-2">Owner</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2"></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-2">
                    {team.user ? team.user.name : <span className="text-neutral-400">(unclaimed) {team.ownerName}</span>}
                  </td>
                  <td className="py-2 pr-2">{team.locked ? "🔒 Locked" : "Unlocked"}</td>
                  <td className="py-2 pr-2">
                    <Link href={`/admin/teams/${team.id}`} className="text-orange-700 underline hover:no-underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
