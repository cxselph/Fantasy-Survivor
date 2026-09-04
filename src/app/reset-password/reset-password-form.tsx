"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/actions/password-reset";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <input
        type="password"
        name="password"
        placeholder="New password"
        autoFocus
        required
        minLength={8}
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
      />
      <input
        type="password"
        name="confirm"
        placeholder="Confirm new password"
        required
        minLength={8}
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
      />
      {state?.error && (
        <p className="text-sm text-red-600">
          {state.error}{" "}
          <Link href="/forgot-password" className="font-medium underline">
            Request a new link
          </Link>
          .
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent-600/20 transition hover:bg-accent-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Saving..." : "Reset password"}
      </button>
    </form>
  );
}
