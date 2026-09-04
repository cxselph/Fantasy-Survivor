"use client";

import { useActionState } from "react";
import { inviteUser } from "@/lib/actions/users";

export function InviteForm({
  unclaimedTeams,
}: {
  unclaimedTeams: { id: number; ownerName: string; seasonNumber: number }[];
}) {
  const [state, formAction, pending] = useActionState(inviteUser, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          type="email"
          name="email"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Name
        <input
          type="text"
          name="name"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="role" value="ADMIN" />
        Grant admin access
      </label>

      {unclaimedTeams.length > 0 && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Link to an existing team (optional)
          <select
            name="teamId"
            defaultValue=""
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          >
            <option value="">Don&apos;t link a team</option>
            {unclaimedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                Season {team.seasonNumber} — {team.ownerName}
              </option>
            ))}
          </select>
        </label>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send invite"}
      </button>
    </form>
  );
}
