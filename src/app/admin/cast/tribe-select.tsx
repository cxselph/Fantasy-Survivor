"use client";

import { useTransition } from "react";
import { setCastawayTribe } from "@/lib/actions/cast";

export function TribeSelect({
  castawayId,
  tribeId,
  tribes,
}: {
  castawayId: number;
  tribeId: number | null;
  tribes: { id: number; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={tribeId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value ? Number(e.target.value) : null;
        startTransition(() => {
          setCastawayTribe(castawayId, value);
        });
      }}
      className="rounded border border-neutral-300 px-2 py-1 text-xs"
    >
      <option value="">No tribe</option>
      {tribes.map((tribe) => (
        <option key={tribe.id} value={tribe.id}>
          {tribe.name}
        </option>
      ))}
    </select>
  );
}
