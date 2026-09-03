"use client";

import { useState, useTransition } from "react";
import { setEliminated } from "@/lib/actions/cast";

export function EliminationToggle({
  castawayId,
  isEliminated: initialEliminated,
  eliminatedWeek,
}: {
  castawayId: number;
  isEliminated: boolean;
  eliminatedWeek: number | null;
}) {
  const [week, setWeek] = useState(eliminatedWeek?.toString() ?? "");
  const [isEliminated, setIsEliminated] = useState(initialEliminated);
  const [pending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    setIsEliminated(checked);
    startTransition(() => {
      setEliminated(castawayId, checked, checked ? Number(week) || null : null);
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={isEliminated}
          disabled={pending}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        Voted out
      </label>
      {!isEliminated && (
        <input
          type="number"
          min={1}
          placeholder="wk"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="w-12 rounded border border-neutral-300 px-1"
        />
      )}
    </div>
  );
}
