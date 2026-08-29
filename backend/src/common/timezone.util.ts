import { DateTime, Interval } from 'luxon';

/**
 * Parse a wall-clock date string ("2025-03-30") and time string ("09:00")
 * in the given IANA timezone and return a UTC DateTime.
 *
 * Luxon handles DST automatically:
 *   - On a spring-forward day the gap hour produces an invalid time (we skip it)
 *   - On a fall-back day the ambiguous hour is resolved by Luxon to the first occurrence
 */
export function toUtc(
  date: string,   // "YYYY-MM-DD"
  time: string,   // "HH:mm"
  timezone: string,
): DateTime {
  return DateTime.fromISO(`${date}T${time}`, { zone: timezone }).toUTC();
}

/**
 * Convert a UTC Date (from PostgreSQL) to a wall-clock time string in the given timezone.
 */
export function utcToZone(utcDate: Date, timezone: string): DateTime {
  return DateTime.fromJSDate(utcDate, { zone: 'UTC' }).setZone(timezone);
}

/**
 * Return the ISO date string ("YYYY-MM-DD") for a given date in a timezone.
 * Needed because "2025-03-30" in London is a different calendar day to UTC.
 */
export function dateInZone(utcDate: Date, timezone: string): string {
  return utcToZone(utcDate, timezone).toISODate();
}

/**
 * Check whether a UTC instant falls within a half-open interval [start, end).
 * A slot that ends at 10:00 and one that starts at 10:00 do NOT overlap.
 */
export function isWithinInterval(
  instant: DateTime,
  start: DateTime,
  end: DateTime,
): boolean {
  return instant >= start && instant < end;
}

/**
 * Check whether two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Used to verify a booking doesn't conflict with existing ones.
 */
export function intervalsOverlap(
  aStart: DateTime,
  aEnd: DateTime,
  bStart: DateTime,
  bEnd: DateTime,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Get the ISO weekday (1=Monday … 7=Sunday) for a date in a specific timezone.
 * Using the resource's timezone ensures we get the correct local day, not UTC day.
 */
export function weekdayInZone(date: string, timezone: string): number {
  return DateTime.fromISO(date, { zone: timezone }).weekday;
}
