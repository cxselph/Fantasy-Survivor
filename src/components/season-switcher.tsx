import Link from "next/link";
import type { Season } from "@/generated/prisma/client";

export function SeasonSwitcher({
  seasons,
  currentNumber,
  basePath,
}: {
  seasons: Season[];
  currentNumber: number;
  basePath: string;
}) {
  if (seasons.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-sm shadow-md backdrop-blur-sm w-fit">
      <span className="text-neutral-500">Season:</span>
      {seasons.map((season) => (
        <Link
          key={season.id}
          href={season.isActive ? basePath : `${basePath}?season=${season.number}`}
          className={`rounded-full border px-3 py-1 ${
            season.number === currentNumber
              ? "border-orange-600 bg-orange-50 text-orange-700"
              : "border-neutral-200 text-neutral-600 hover:border-orange-300"
          }`}
        >
          {season.number}
          {season.isActive && " · current"}
        </Link>
      ))}
    </div>
  );
}
