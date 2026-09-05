// Small helpers for converting between a wall-clock date/time an admin picks in some IANA
// timezone and the absolute UTC instant it represents. No date library needed - these lean on
// Intl.DateTimeFormat, which already knows every zone's DST rules for any given date.

export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Mountain, no DST (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "UTC", label: "UTC" },
];

function partsAt(timeZone: string, utcMs: number): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return Object.fromEntries(
    dtf.formatToParts(new Date(utcMs)).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );
}

/** Offset (ms) such that `utcMs - offset` is the UTC instant whose wall clock in `timeZone` reads the same as `utcMs`'s. */
function tzOffsetMs(timeZone: string, utcMs: number): number {
  const p = partsAt(timeZone, utcMs);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - utcMs;
}

/** Converts a wall-clock date + time picked in `timeZone` into the absolute UTC instant it represents. */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(guess - tzOffsetMs(timeZone, guess));
}

/** Inverse of zonedTimeToUtc - the date/time input values that would redisplay `date` in `timeZone`. */
export function utcToZonedParts(date: Date, timeZone: string): { date: string; time: string } {
  const p = partsAt(timeZone, date.getTime());
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** Human-readable instant, e.g. "Sep 23, 2026, 8:00 PM EDT". */
export function formatInTimeZone(date: Date, timeZone: string): string {
  // Intl.DateTimeFormat rejects dateStyle/timeStyle combined with component options like
  // timeZoneName, so the abbreviation has to come from a second, separate formatter.
  const main = new Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(date);
  const zoneName =
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", timeZoneName: "short" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  return `${main} ${zoneName}`;
}
