"use client";

import { useActionState, useState } from "react";
import type { Castaway } from "@/generated/prisma/client";
import { saveTeam } from "@/lib/actions/team";

export function JoinForm({
  castaways,
  ownerName,
  selectedIds,
  powerPlayerId,
  locked,
  alreadyLocked,
}: {
  castaways: Castaway[];
  ownerName: string;
  selectedIds: number[];
  powerPlayerId: number | null;
  locked: boolean;
  alreadyLocked: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveTeam, undefined);
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const [powerPlayer, setPowerPlayer] = useState<number | null>(powerPlayerId);
  const [wantsLock, setWantsLock] = useState(false);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (powerPlayer === id) setPowerPlayer(null);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (wantsLock && !window.confirm("Lock in your picks? Only the commissioner can unlock this afterward.")) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-4 rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm"
    >
      <fieldset disabled={locked} className="flex flex-col gap-4 disabled:opacity-60">
        <label className="flex max-w-xs flex-col gap-1 text-sm font-medium">
          Your name
          <input
            type="text"
            name="ownerName"
            defaultValue={ownerName}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </label>

        <div className="text-sm text-neutral-600">
          Selected {selected.size} / 5
          {powerPlayer == null && selected.size === 5 && (
            <span className="ml-2 text-red-600">Choose a Power Player below.</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {castaways.map((castaway) => {
            const isSelected = selected.has(castaway.id);
            return (
              <div
                key={castaway.id}
                className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                  castaway.isEliminated ? "border-neutral-100 bg-neutral-50 text-neutral-400" : "border-neutral-200"
                }`}
              >
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    name="castawayIds"
                    value={castaway.id}
                    checked={isSelected}
                    disabled={!isSelected && selected.size >= 5}
                    onChange={() => toggle(castaway.id)}
                  />
                  {castaway.name}
                  {castaway.isEliminated && <span className="text-xs">(voted out)</span>}
                </label>
                {isSelected && (
                  <label className="flex items-center gap-1 text-xs font-medium text-orange-700">
                    <input
                      type="radio"
                      name="powerPlayerId"
                      value={castaway.id}
                      checked={powerPlayer === castaway.id}
                      onChange={() => setPowerPlayer(castaway.id)}
                    />
                    Power Player
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        {!alreadyLocked && (
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              name="lockTeam"
              checked={wantsLock}
              onChange={(e) => setWantsLock(e.target.checked)}
            />
            🔒 Lock in my picks — I&apos;m done, don&apos;t let anyone (including me) change this without the
            commissioner unlocking it.
          </label>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-lg disabled:opacity-50"
        >
          {pending ? "Saving..." : wantsLock ? "Save & Lock In" : "Save Team"}
        </button>
      </fieldset>
    </form>
  );
}
