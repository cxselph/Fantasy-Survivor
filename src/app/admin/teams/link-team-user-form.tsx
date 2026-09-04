"use client";

import { useActionState } from "react";
import { linkTeamUser } from "@/lib/actions/team";

export function LinkTeamUserForm({
  teamId,
  candidates,
}: {
  teamId: number;
  candidates: { id: number; name: string; email: string }[];
}) {
  const [state, formAction, pending] = useActionState(linkTeamUser.bind(null, teamId), undefined);

  if (candidates.length === 0) {
    return <p className="text-sm text-neutral-500">No unlinked active accounts available to link.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
        Link to
        <select name="userId" defaultValue="" required className="rounded-md border border-neutral-300 px-2 py-1 text-sm">
          <option value="" disabled>
            Choose a user…
          </option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-700 hover:border-orange-400 disabled:opacity-50"
      >
        {pending ? "Linking..." : "Link"}
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
