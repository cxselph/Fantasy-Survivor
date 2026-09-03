"use client";

import { useActionState } from "react";
import { createTribe, createCastaway } from "@/lib/actions/cast";

export function AddTribeForm() {
  const [state, formAction, pending] = useActionState(createTribe, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Tribe name
        <input name="name" required className="rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Color
        <input type="color" name="color" defaultValue="#6b7280" className="h-8 w-14 rounded border border-neutral-300" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Add Tribe
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}

export function AddCastawayForm() {
  const [state, formAction, pending] = useActionState(createCastaway, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Name
        <input name="name" required className="rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Bio
        <input name="bio" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Photo URL
        <input name="photoUrl" placeholder="https://..." className="rounded border border-neutral-300 px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col gap-0.5 text-xs font-medium">
        Or upload a photo
        <input type="file" name="photoFile" accept="image/*" className="text-xs" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Add Castaway
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
