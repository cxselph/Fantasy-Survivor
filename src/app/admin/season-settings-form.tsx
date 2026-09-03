"use client";

import { useActionState } from "react";
import type { Season } from "@/generated/prisma/client";
import { updateSeasonSettings } from "@/lib/actions/scoring";

export function SeasonSettingsForm({ season }: { season: Season }) {
  const [state, formAction, pending] = useActionState(updateSeasonSettings, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="seasonId" value={season.id} />

      <label className="flex flex-col gap-1 text-sm font-medium">
        Merge happens at week
        <input
          type="number"
          name="mergeWeek"
          min={1}
          defaultValue={season.mergeWeek ?? ""}
          placeholder="e.g. 6"
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm font-medium">
        <input type="checkbox" name="draftLocked" defaultChecked={season.draftLocked} />
        Lock the draft (no more team changes by participants)
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Settings"}
      </button>

      {state?.success && <span className="text-sm text-green-700">Saved.</span>}
    </form>
  );
}
