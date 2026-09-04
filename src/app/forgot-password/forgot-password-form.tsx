"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/password-reset";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return <p className="text-center text-sm text-green-700">{state.success}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="email"
        name="email"
        placeholder="Email"
        autoFocus
        required
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent-600/20 transition hover:bg-accent-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
