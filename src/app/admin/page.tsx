import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";
import { SeasonSettingsForm } from "./season-settings-form";

export default async function AdminPage() {
  await requireAdmin();
  const season = await getActiveSeason();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Commissioner Admin</h1>

      <div className="flex gap-3">
        <Link
          href="/admin/cast"
          className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:border-orange-300"
        >
          Manage Cast &amp; Tribes →
        </Link>
        <Link
          href="/admin/scoring"
          className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:border-orange-300"
        >
          Enter Weekly Scoring →
        </Link>
        <Link
          href="/admin/seasons"
          className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:border-orange-300"
        >
          Manage Seasons →
        </Link>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Season Settings</h2>
        <SeasonSettingsForm season={season} />
      </section>
    </div>
  );
}
