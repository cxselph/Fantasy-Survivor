"use client";

import { useRouter } from "next/navigation";

export function TeamSwitcher({
  teams,
  currentOwner,
}: {
  teams: { ownerName: string; locked: boolean }[];
  currentOwner?: string;
}) {
  const router = useRouter();

  return (
    <label className="flex w-fit items-center gap-2 rounded-xl bg-white/85 px-3 py-2 text-sm shadow-md backdrop-blur-sm">
      Edit an existing team:
      <select
        value={currentOwner ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value ? `/join?owner=${encodeURIComponent(value)}` : "/join");
        }}
        className="max-w-[10rem] rounded-md border border-neutral-300 px-2 py-1 text-sm"
      >
        <option value="">New team...</option>
        {teams.map((team) => (
          <option key={team.ownerName} value={team.ownerName}>
            {team.locked ? "🔒 " : ""}
            {team.ownerName}
          </option>
        ))}
      </select>
    </label>
  );
}
