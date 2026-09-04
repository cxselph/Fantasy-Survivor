"use client";

import { useActionState } from "react";
import { sendTestEmailAction } from "@/lib/actions/smtp-settings";

export function TestEmailForm() {
  const [state, formAction, pending] = useActionState(sendTestEmailAction, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Send to
          <input
            type="email"
            name="to"
            required
            placeholder="you@example.com"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition hover:border-orange-400 disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send test"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
