"use client";

import { useActionState, useEffect, useState } from "react";
import type { Tribe } from "@/generated/prisma/client";
import { deleteTribe, updateTribe } from "@/lib/actions/cast";

export function TribeChip({ tribe }: { tribe: Tribe }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateTribe, undefined);

  useEffect(() => {
    if (state && !state.error) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <form action={formAction} className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-2 py-1 text-sm">
        <input type="hidden" name="tribeId" value={tribe.id} />
        <input
          name="name"
          defaultValue={tribe.name}
          required
          className="w-24 rounded border border-neutral-300 px-1.5 py-0.5 text-sm"
        />
        <input type="color" name="color" defaultValue={tribe.color} className="h-6 w-8 rounded border border-neutral-300" />
        <button type="submit" disabled={pending} className="text-xs font-medium text-orange-700 disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-400 hover:text-neutral-600">
          Cancel
        </button>
        {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      </form>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-white"
      style={{ backgroundColor: tribe.color }}
    >
      {tribe.name}
      <button type="button" onClick={() => setEditing(true)} className="opacity-70 hover:opacity-100">
        ✎
      </button>
      <form action={deleteTribe}>
        <input type="hidden" name="tribeId" value={tribe.id} />
        <button type="submit" className="opacity-70 hover:opacity-100">
          ✕
        </button>
      </form>
    </div>
  );
}
