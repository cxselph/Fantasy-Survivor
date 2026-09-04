"use client";

import { useActionState } from "react";
import { createSeason } from "@/lib/actions/season";

export function CreateSeasonForm() {
  const [state, formAction, pending] = useActionState(createSeason, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Season number
        <input
          type="number"
          name="number"
          min={1}
          required
          placeholder="52"
          className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Name
        <input
          name="name"
          required
          placeholder="e.g. The Next Chapter"
          className="rounded border border-neutral-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Create Season
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
