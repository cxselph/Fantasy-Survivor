import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildSeasonBackup } from "@/lib/season-backup";

export async function GET(_request: Request, { params }: { params: Promise<{ seasonId: string }> }) {
  await requireAdmin();
  const { seasonId } = await params;

  const backup = await buildSeasonBackup(Number(seasonId));
  if (!backup) {
    return NextResponse.json({ error: "Season not found." }, { status: 404 });
  }

  const filename = `season-${backup.season.number}-backup.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
