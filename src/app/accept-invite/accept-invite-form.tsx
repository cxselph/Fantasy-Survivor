"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/lib/actions/users";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvite, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <input
        type="password"
        name="password"
        placeholder="Choose a password"
        autoFocus
        required
        minLength={8}
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
      />
      <input
        type="password"
        name="confirm"
        placeholder="Confirm password"
        required
        minLength={8}
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Setting up..." : "Create account"}
      </button>
    </form>
  );
}
