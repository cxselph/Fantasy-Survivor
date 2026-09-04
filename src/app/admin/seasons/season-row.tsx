"use client";

import { useActionState, useState } from "react";
import type { Season } from "@/generated/prisma/client";
import { activateSeason, deleteSeason, updateSeasonInfo } from "@/lib/actions/season";

export function SeasonRow({ season }: { season: Season }) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editPending] = useActionState(updateSeasonInfo, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSeason, undefined);

  function handleDeleteSubmit(e: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Permanently delete Season ${season.number}: ${season.name}?\n\n` +
        "This deletes EVERYTHING for this season - the cast, tribes, drafted teams, and all " +
        "scoring history. This cannot be undone.",
    );
    if (!confirmed) e.preventDefault();
  }

  return (
    <div className="rounded-md border border-neutral-200 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-medium">
            Season {season.number}: {season.name}
          </span>
          {season.isActive && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-accent-300 hover:text-accent-700"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          {!season.isActive && (
            <>
              <form action={activateSeason.bind(null, season.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 hover:border-accent-300 hover:text-accent-700"
                >
                  Make this the current season
                </button>
              </form>
              <form action={deleteAction} onSubmit={handleDeleteSubmit}>
                <input type="hidden" name="seasonId" value={season.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {deleteState?.error && <p className="mt-2 text-xs text-red-600">{deleteState.error}</p>}

      {editing && (
        <form action={editAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
          <input type="hidden" name="seasonId" value={season.id} />
          <label className="flex flex-col gap-0.5 text-xs font-medium">
            Number
            <input
              type="number"
              name="number"
              min={1}
              defaultValue={season.number}
              required
              className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-xs font-medium">
            Name
            <input
              name="name"
              defaultValue={season.name}
              required
              className="rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={editPending}
            className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {editPending ? "Saving..." : "Save"}
          </button>
          {editState?.error && <span className="text-sm text-red-600">{editState.error}</span>}
        </form>
      )}
    </div>
  );
}
