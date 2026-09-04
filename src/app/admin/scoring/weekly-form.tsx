"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { Castaway } from "@/generated/prisma/client";
import { saveWeeklyResults } from "@/lib/actions/scoring";

export type WeeklyEntry = {
  challenge: boolean;
  tribal: boolean;
  placement: 1 | 2 | 3 | null;
};

export function WeeklyForm({
  week,
  totalWeeks,
  castaways,
  entries,
}: {
  week: number;
  totalWeeks: number;
  castaways: Castaway[];
  entries: Map<number, WeeklyEntry>;
}) {
  const [state, formAction, pending] = useActionState(saveWeeklyResults, undefined);
  const router = useRouter();
  const [weekInput, setWeekInput] = useState(week.toString());

  function goToWeek(nextWeek: number) {
    if (!Number.isInteger(nextWeek) || nextWeek < 1 || nextWeek > totalWeeks) return;
    router.push(`/admin/scoring?week=${nextWeek}`);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <label className="flex w-32 flex-col gap-1 text-sm font-medium">
          Week
          <input
            type="number"
            name="week"
            min={1}
            max={totalWeeks}
            value={weekInput}
            required
            onChange={(e) => setWeekInput(e.target.value)}
            onBlur={() => goToWeek(Number(weekInput))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                goToWeek(Number(weekInput));
              }
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => goToWeek(week - 1)}
          disabled={week <= 1}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
        >
          ← Previous week
        </button>
        <button
          type="button"
          onClick={() => goToWeek(week + 1)}
          disabled={week >= totalWeeks}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
        >
          Next week →
        </button>
        <span className="pb-2 text-xs text-neutral-400">
          Week {week} of {totalWeeks}. Jump to any week to view or correct what was entered.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="py-2">Castaway</th>
              <th className="py-2">Won Challenge</th>
              <th className="py-2">Survived Tribal</th>
              <th className="py-2">Final Placement</th>
            </tr>
          </thead>
          <tbody>
            {castaways.map((castaway) => {
              const entry = entries.get(castaway.id);
              // Grey out only once we're past the week they were actually voted out in -
              // earlier weeks (including the week they went out) should read/edit normally.
              const isOut = castaway.isEliminated && (castaway.eliminatedWeek == null || week > castaway.eliminatedWeek);
              return (
                <tr
                  key={castaway.id}
                  className={`border-b border-neutral-100 ${isOut ? "text-neutral-400" : ""}`}
                >
                  <td className="py-1.5 pr-2 font-medium">
                    {castaway.name}
                    {castaway.isEliminated && (
                      <span className="ml-2 text-xs font-normal text-neutral-400">
                        (voted out{castaway.eliminatedWeek != null ? ` — Wk ${castaway.eliminatedWeek}` : ""})
                      </span>
                    )}
                  </td>
                  <td className="py-1.5">
                    <input
                      type="checkbox"
                      name={`challenge_${castaway.id}`}
                      defaultChecked={entry?.challenge}
                      disabled={isOut}
                    />
                  </td>
                  <td className="py-1.5">
                    <input
                      type="checkbox"
                      name={`tribal_${castaway.id}`}
                      defaultChecked={entry?.tribal}
                      disabled={isOut}
                    />
                  </td>
                  <td className="py-1.5">
                    <select
                      name={`placement_${castaway.id}`}
                      defaultValue={entry?.placement ?? ""}
                      disabled={isOut}
                      className="rounded border border-neutral-300 px-1 py-0.5 text-xs disabled:bg-neutral-100"
                    >
                      <option value="">—</option>
                      <option value={1}>1st (Sole Survivor)</option>
                      <option value={2}>2nd</option>
                      <option value={3}>3rd</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Week saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Week"}
      </button>
    </form>
  );
}
