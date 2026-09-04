"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <input
        type="email"
        name="email"
        placeholder="Email"
        autoFocus
        required
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent-600/20 transition hover:bg-accent-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Checking..." : "Log in"}
      </button>
      <Link href="/forgot-password" className="text-center text-sm text-neutral-500 underline hover:no-underline">
        Forgot password?
      </Link>
    </form>
  );
}
