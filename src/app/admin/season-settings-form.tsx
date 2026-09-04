"use client";

import { useActionState, useState } from "react";
import type { Season } from "@/generated/prisma/client";
import { updateSeasonSettings } from "@/lib/actions/scoring";

export function SeasonSettingsForm({ season }: { season: Season }) {
  const [state, formAction, pending] = useActionState(updateSeasonSettings, undefined);
  const [preview, setPreview] = useState<string | null>(season.bannerUrl);
  const [removeBanner, setRemoveBanner] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveBanner(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="seasonId" value={season.id} />

      <div className="flex flex-wrap items-end gap-4">
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

        <label className="flex flex-col gap-1 text-sm font-medium">
          Season length (weeks)
          <input
            type="number"
            name="totalWeeks"
            min={1}
            defaultValue={season.totalWeeks}
            className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm font-medium">
          <input type="checkbox" name="draftLocked" defaultChecked={season.draftLocked} />
          Lock the draft (no more team changes by participants)
        </label>
      </div>
      <p className="-mt-2 text-xs text-neutral-400">
        Weekly Scoring won&apos;t let you go past this week count. Survivor is usually 13 weeks -
        raise this if a season runs long.
      </p>

      <div className="flex flex-col gap-1 border-t border-neutral-100 pt-3">
        <label className="flex flex-col gap-0.5 text-sm font-medium">
          Site title
          <input
            name="siteTitle"
            defaultValue={season.siteTitle ?? ""}
            placeholder={`🔥 Survivor ${season.number} League`}
            className="max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <p className="text-xs text-neutral-400">
          Shown on the login page and the nav bar once logged in. Leave blank to use the default shown above.
        </p>
      </div>

      <div className="flex items-start gap-3 border-t border-neutral-100 pt-3">
        {preview && !removeBanner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-16 w-32 rounded object-cover" />
        )}
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium">Login page banner</span>
          <label className="flex flex-col gap-0.5 text-xs">
            Image URL
            <input
              name="bannerUrl"
              defaultValue={season.bannerUrl?.startsWith("data:") ? "" : (season.bannerUrl ?? "")}
              placeholder="https://..."
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setRemoveBanner(false);
                  setPreview(e.target.value.trim());
                }
              }}
              className="max-w-md rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-xs">
            Or upload an image (JPEG/PNG, max 4MB)
            <input type="file" name="bannerFile" accept="image/*" onChange={handleFileChange} className="text-xs" />
          </label>
          {season.bannerUrl && (
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                name="removeBanner"
                checked={removeBanner}
                onChange={(e) => {
                  setRemoveBanner(e.target.checked);
                  if (e.target.checked) setPreview(null);
                  else setPreview(season.bannerUrl);
                }}
              />
              Remove the current banner
            </label>
          )}
          <p className="text-xs text-neutral-400">
            Leaving both blank keeps whatever banner is already set.
          </p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Settings"}
        </button>
        {state?.success && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </form>
  );
}
