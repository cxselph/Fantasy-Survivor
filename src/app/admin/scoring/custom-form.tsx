"use client";

import { useActionState } from "react";
import type { Castaway } from "@/generated/prisma/client";
import { addCustomAdjustment, deleteScoreEvent } from "@/lib/actions/scoring";

export function CustomAdjustmentForm({ castaways }: { castaways: Castaway[] }) {
  const [state, formAction, pending] = useActionState(addCustomAdjustment, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Castaway
        <select name="castawayId" required className="rounded border border-neutral-300 px-2 py-1 text-sm">
          <option value="">Select...</option>
          {castaways.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Week
        <input type="number" name="week" min={1} required className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Points (+/-)
        <input type="number" name="points" required className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Label
        <input name="label" required placeholder="e.g. Idol nullified bonus" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Add
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}

export function DeleteEventButton({ id, description }: { id: number; description: string }) {
  return (
    <form
      action={deleteScoreEvent}
      onSubmit={(e) => {
        if (!window.confirm(`Remove this scoring entry?\n\n${description}\n\nThis cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
        remove
      </button>
    </form>
  );
}
