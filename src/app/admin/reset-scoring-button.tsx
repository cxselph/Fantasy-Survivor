"use client";

import { useTransition } from "react";
import { resetScoring } from "@/lib/actions/scoring";

export function ResetScoringButton({ seasonLabel }: { seasonLabel: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Reset ALL scoring for ${seasonLabel}?\n\n` +
        "This permanently deletes every weekly score, custom adjustment, and un-eliminates " +
        "every castaway (clears voted-out status and final placements).\n\n" +
        "Drafted teams, the cast list, and tribes are NOT affected.\n\n" +
        "This cannot be undone.",
    );
    if (!confirmed) return;
    startTransition(() => {
      resetScoring();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? "Resetting..." : `Reset All Scoring for ${seasonLabel}`}
    </button>
  );
}
