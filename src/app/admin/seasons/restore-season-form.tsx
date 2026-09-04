"use client";

import { useActionState } from "react";
import { restoreSeason } from "@/lib/actions/season";

export function RestoreSeasonForm() {
  const [state, formAction, pending] = useActionState(restoreSeason, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Backup file
        <input
          type="file"
          name="backupFile"
          accept="application/json"
          required
          className="text-sm"
        />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Restore as season #
        <input
          type="number"
          name="seasonNumber"
          min={1}
          placeholder="from file"
          className="w-28 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Restoring..." : "Restore Season"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.success && <span className="text-sm text-green-700">{state.success}</span>}
    </form>
  );
}
