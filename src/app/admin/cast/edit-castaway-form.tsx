"use client";

import { useActionState, useState } from "react";
import type { Castaway } from "@/generated/prisma/client";
import { updateCastaway } from "@/lib/actions/cast";

export function EditCastawayForm({ castaway }: { castaway: Castaway }) {
  const [state, formAction, pending] = useActionState(updateCastaway, undefined);
  const [preview, setPreview] = useState<string | null>(castaway.photoUrl);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-2 text-xs">
      <input type="hidden" name="castawayId" value={castaway.id} />
      <label className="flex flex-col gap-0.5">
        Name
        <input name="name" defaultValue={castaway.name} className="rounded border border-neutral-300 px-2 py-1" />
      </label>
      <label className="flex flex-col gap-0.5">
        Bio
        <input name="bio" defaultValue={castaway.bio ?? ""} className="rounded border border-neutral-300 px-2 py-1" />
      </label>

      <div className="flex items-start gap-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-16 w-16 rounded object-cover" />
        )}
        <div className="flex flex-1 flex-col gap-2">
          <label className="flex flex-col gap-0.5">
            Photo URL
            <input
              name="photoUrl"
              defaultValue={castaway.photoUrl?.startsWith("data:") ? "" : (castaway.photoUrl ?? "")}
              placeholder="https://..."
              onChange={(e) => {
                if (e.target.value.trim()) setPreview(e.target.value.trim());
              }}
              className="rounded border border-neutral-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            Or upload a photo (JPEG/PNG, max 4MB)
            <input
              type="file"
              name="photoFile"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs"
            />
          </label>
          <p className="text-neutral-400">If you upload a file, it will be used instead of the URL above.</p>
        </div>
      </div>

      <label className="flex flex-col gap-0.5">
        Sort order
        <input
          type="number"
          name="sortOrder"
          defaultValue={castaway.sortOrder}
          className="w-20 rounded border border-neutral-300 px-2 py-1"
        />
      </label>
      {state?.error && <p className="text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-neutral-800 px-3 py-1 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
