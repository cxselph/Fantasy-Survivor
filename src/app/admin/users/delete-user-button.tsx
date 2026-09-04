"use client";

import { useTransition } from "react";
import { deleteUser } from "@/lib/actions/users";

export function DeleteUserButton({
  userId,
  name,
  label = "Delete",
}: {
  userId: number;
  name: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(`Permanently delete ${name}?\n\nThis can't be undone.`);
    if (!confirmed) return;
    startTransition(() => {
      deleteUser(userId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs font-semibold text-red-700 underline hover:no-underline disabled:opacity-50"
    >
      {pending ? "Deleting..." : label}
    </button>
  );
}
