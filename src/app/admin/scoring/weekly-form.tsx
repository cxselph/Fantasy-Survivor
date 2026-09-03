"use client";

import { useActionState } from "react";
import type { Castaway } from "@/generated/prisma/client";
import { saveWeeklyResults } from "@/lib/actions/scoring";

export type WeeklyEntry = {
  challenge: boolean;
  tribal: boolean;
  placement: 1 | 2 | 3 | null;
};

export function WeeklyForm({
  week,
  castaways,
  entries,
}: {
  week: number;
  castaways: Castaway[];
  entries: Map<number, WeeklyEntry>;
}) {
  const [state, formAction, pending] = useActionState(saveWeeklyResults, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex w-32 flex-col gap-1 text-sm font-medium">
        Week
        <input
          type="number"
          name="week"
          min={1}
          defaultValue={week}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

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
              return (
                <tr
                  key={castaway.id}
                  className={`border-b border-neutral-100 ${castaway.isEliminated ? "text-neutral-400" : ""}`}
                >
                  <td className="py-1.5 pr-2 font-medium">{castaway.name}</td>
                  <td className="py-1.5">
                    <input type="checkbox" name={`challenge_${castaway.id}`} defaultChecked={entry?.challenge} />
                  </td>
                  <td className="py-1.5">
                    <input type="checkbox" name={`tribal_${castaway.id}`} defaultChecked={entry?.tribal} />
                  </td>
                  <td className="py-1.5">
                    <select
                      name={`placement_${castaway.id}`}
                      defaultValue={entry?.placement ?? ""}
                      className="rounded border border-neutral-300 px-1 py-0.5 text-xs"
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
