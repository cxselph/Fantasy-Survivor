"use client";

import { useState } from "react";
import { createInviteLink, createPasswordResetLink } from "@/lib/actions/users";

// Generates a one-time invite/reset link on demand and copies it, for someone whose email isn't
// getting through (see the invite email status badges) - the admin can paste it into a text,
// DM, or hand it over in person instead of relying on email delivery at all.
export function CopyLinkButton({ userId, kind }: { userId: number; kind: "invite" | "reset" }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setPending(true);
    setError(null);
    setCopied(false);
    const result = kind === "invite" ? await createInviteLink(userId) : await createPasswordResetLink(userId);
    setPending(false);
    setLink(result.link ?? null);
    setError(result.error ?? null);
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browser, non-HTTPS) - the link is still shown
      // in a selectable field below, so a manual select-and-copy still works either way.
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="text-xs font-semibold text-accent-700 underline hover:no-underline disabled:opacity-50"
      >
        {pending ? "Generating..." : kind === "invite" ? "Copy invite link" : "Copy reset link"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {link && (
        <div className="flex items-center gap-1.5">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="w-56 rounded-md border border-neutral-300 px-2 py-1 font-mono text-[11px] text-neutral-600"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md border border-accent-300 bg-white px-2 py-1 text-xs font-semibold text-accent-700 hover:border-accent-400"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <span className="text-[11px] whitespace-nowrap text-neutral-400">
            {kind === "invite" ? "Valid 7 days" : "Valid 1 hour"}
          </span>
        </div>
      )}
    </div>
  );
}
