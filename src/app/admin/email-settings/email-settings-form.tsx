"use client";

import { useActionState } from "react";
import { updateSmtpSettings } from "@/lib/actions/smtp-settings";

export function EmailSettingsForm({
  settings,
}: {
  settings: {
    host: string;
    port: number;
    username: string;
    fromEmail: string;
    fromName: string;
    hasPassword: boolean;
    passwordNeedsResave: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(updateSmtpSettings, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      {settings.passwordNeedsResave && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          The saved password couldn&apos;t be decrypted (the encryption key may have changed since
          it was saved) — emails will silently be skipped until you re-enter and save it below.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Host
        <input
          type="text"
          name="host"
          defaultValue={settings.host}
          placeholder="mail.smtp2go.com"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Port
        <input
          type="number"
          name="port"
          defaultValue={settings.port}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Username
        <input
          type="text"
          name="username"
          defaultValue={settings.username}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          type="password"
          name="password"
          placeholder={settings.hasPassword ? "•••••••• (leave blank to keep the saved password)" : "Enter a password"}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
        <span className={`text-xs ${settings.passwordNeedsResave ? "font-medium text-red-600" : "text-neutral-500"}`}>
          {settings.passwordNeedsResave
            ? "Can't be decrypted — re-enter it to fix."
            : settings.hasPassword
              ? "A password is already saved — leave this blank to keep it."
              : "No password saved yet."}
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        From email
        <input
          type="email"
          name="fromEmail"
          defaultValue={settings.fromEmail}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        From name
        <input
          type="text"
          name="fromName"
          defaultValue={settings.fromName}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-lg disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
