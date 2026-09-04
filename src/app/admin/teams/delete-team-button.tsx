"use client";

import { useTransition } from "react";
import { deleteTeam } from "@/lib/actions/team";

export function DeleteTeamButton({ teamId, ownerName }: { teamId: number; ownerName: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Permanently delete ${ownerName}'s team?\n\nThis removes their picks entirely - it can't be undone.`,
    );
    if (!confirmed) return;
    startTransition(() => {
      deleteTeam(teamId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm font-semibold text-red-700 underline hover:no-underline disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete Team"}
    </button>
  );
}
