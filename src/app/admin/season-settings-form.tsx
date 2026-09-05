"use client";

import { useActionState, useState } from "react";
import type { Season } from "@/generated/prisma/client";
import { updateSeasonSettings } from "@/lib/actions/scoring";
import { DEFAULT_ACCENT } from "@/lib/theme";

export function SeasonSettingsForm({ season }: { season: Season }) {
  const [state, formAction, pending] = useActionState(updateSeasonSettings, undefined);
  const [preview, setPreview] = useState<string | null>(season.bannerUrl);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [bgPreview, setBgPreview] = useState<string | null>(season.backgroundUrl);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [backgroundDim, setBackgroundDim] = useState(season.backgroundDim);
  const [accentColor, setAccentColor] = useState(season.accentColor ?? DEFAULT_ACCENT);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveBanner(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveBackground(false);
    const reader = new FileReader();
    reader.onload = () => setBgPreview(reader.result as string);
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

      <label className="flex items-center gap-2 border-t border-neutral-100 pt-3 text-sm font-medium">
        <input
          type="checkbox"
          name="hideTeamsUntilLocked"
          defaultChecked={season.hideTeamsUntilLocked}
        />
        Hide everyone&apos;s picks (including from admins) until the draft is locked
      </label>
      <p className="-mt-2 text-xs text-neutral-400">
        No peeking at other teams&apos; picks on the Dashboard or Admin → Manage Teams while the
        draft is still open — everyone can always see their own team. An admin can still choose
        to temporarily reveal a hidden team when they genuinely need to.
      </p>

      <div className="flex flex-col gap-1 border-t border-neutral-100 pt-3">
        <label className="flex flex-col gap-0.5 text-sm font-medium">
          Site title
          <input
            name="siteTitle"
            defaultValue={season.siteTitle ?? ""}
            placeholder={`🔥 Survivor ${season.number} League`}
            className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <p className="text-xs text-neutral-400">
          Shown on the login page and the nav bar once logged in. Leave blank to use the default shown above.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
        <span className="text-sm font-medium">Theme color</span>
        <p className="text-xs text-neutral-400">
          Used for buttons, titles, and borders site-wide.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            name="accentColor"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-9 w-16 cursor-pointer rounded border border-neutral-300"
          />
          <span className="font-mono text-xs text-neutral-500">{accentColor}</span>
          {accentColor.toLowerCase() !== DEFAULT_ACCENT && (
            <button
              type="button"
              onClick={() => setAccentColor(DEFAULT_ACCENT)}
              className="text-xs font-medium text-accent-700 underline hover:no-underline"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 border-t border-neutral-100 pt-3">
        {preview && !removeBanner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-16 w-32 rounded object-cover" />
        )}
        <div className="min-w-0 flex flex-1 flex-col gap-2">
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
              className="w-full max-w-md rounded border border-neutral-300 px-2 py-1 text-sm"
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

      <div className="flex items-start gap-3 border-t border-neutral-100 pt-3">
        {bgPreview && !removeBackground && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgPreview} alt="" className="h-16 w-32 rounded object-cover" />
        )}
        <div className="min-w-0 flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium">Site background</span>
          <p className="text-xs text-neutral-400">
            Shows behind every page (e.g. a Fiji beach shot, or a favorite moment from a past
            season). Without one, a tropical gradient is used.
          </p>
          <label className="flex flex-col gap-0.5 text-xs">
            Image URL
            <input
              name="backgroundUrl"
              defaultValue={season.backgroundUrl?.startsWith("data:") ? "" : (season.backgroundUrl ?? "")}
              placeholder="https://..."
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setRemoveBackground(false);
                  setBgPreview(e.target.value.trim());
                }
              }}
              className="w-full max-w-md rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-xs">
            Or upload an image (JPEG/PNG, max 4MB)
            <input
              type="file"
              name="backgroundFile"
              accept="image/*"
              onChange={handleBgFileChange}
              className="text-xs"
            />
          </label>
          {season.backgroundUrl && (
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                name="removeBackground"
                checked={removeBackground}
                onChange={(e) => {
                  setRemoveBackground(e.target.checked);
                  if (e.target.checked) setBgPreview(null);
                  else setBgPreview(season.backgroundUrl);
                }}
              />
              Remove the current background (use the default gradient)
            </label>
          )}

          <label className="flex flex-col gap-1 text-xs">
            Background darkness ({backgroundDim}%) — dims the photo so text stays readable
            <input
              type="range"
              name="backgroundDim"
              min={0}
              max={100}
              value={backgroundDim}
              onChange={(e) => setBackgroundDim(Number(e.target.value))}
              className="w-full max-w-md accent-accent-600"
            />
          </label>
          {bgPreview && !removeBackground && (
            <div
              className="h-20 w-full max-w-md rounded-lg bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(rgba(8,20,30,${backgroundDim / 100}), rgba(8,20,30,${backgroundDim / 100})), url(${bgPreview})`,
              }}
            />
          )}
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Settings"}
        </button>
        {state?.success && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </form>
  );
}
