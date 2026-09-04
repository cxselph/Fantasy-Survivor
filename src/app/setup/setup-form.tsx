"use client";

import { useActionState } from "react";
import { claimAdmin } from "@/lib/actions/bootstrap";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(claimAdmin, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Setup password
        <input
          type="password"
          name="adminPassword"
          required
          autoFocus
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Your name
        <input
          type="text"
          name="name"
          required
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Your email
        <input
          type="email"
          name="email"
          required
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Choose a password
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Confirm password
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent-600/20 transition hover:bg-accent-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Setting up..." : "Create admin account"}
      </button>
    </form>
  );
}
