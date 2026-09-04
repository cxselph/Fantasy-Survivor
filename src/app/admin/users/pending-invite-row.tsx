"use client";

import { useActionState } from "react";
import { updateInvite } from "@/lib/actions/users";

export function PendingInviteRow({
  user,
}: {
  user: { id: number; email: string; name: string; role: "ADMIN" | "MEMBER" };
}) {
  const [state, formAction, pending] = useActionState(updateInvite, undefined);

  return (
    <tr className="border-b border-neutral-100 align-top">
      <td className="py-2" colSpan={5}>
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Name
            <input
              type="text"
              name="name"
              defaultValue={user.name}
              required
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Email
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              required
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-1 text-xs font-medium text-neutral-500">
            <input type="checkbox" name="role" value="ADMIN" defaultChecked={user.role === "ADMIN"} />
            Admin
          </label>
          <span className="text-xs font-medium text-yellow-700">Invite pending</span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-700 hover:border-orange-400 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save & resend"}
          </button>
        </form>
        {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="mt-1 text-xs text-green-700">{state.success}</p>}
      </td>
    </tr>
  );
}
