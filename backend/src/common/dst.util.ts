import { DateTime } from 'luxon';

/**
 * Check whether a wall-clock time on a given date in a timezone falls
 * inside a DST spring-forward gap (i.e. the time doesn't actually exist).
 *
 * How: parse the time in the zone, convert to UTC, then convert back.
 * If the round-trip local time differs from what we put in, the original
 * time was in the gap and Luxon silently shifted it forward.
 *
 * Example — London 2025-03-30 (spring-forward at 01:00):
 *   isInSpringForwardGap('2025-03-30', '01:30', 'Europe/London') → true
 *   isInSpringForwardGap('2025-03-30', '09:00', 'Europe/London') → false
 */
export function isInSpringForwardGap(
  date: string,
  time: string,
  timezone: string,
): boolean {
  const parsed = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  const roundTrip = parsed.toUTC().setZone(timezone).toFormat('HH:mm');
  return roundTrip !== time;
}

/**
 * On a DST fall-back day the same wall-clock hour occurs twice.
 * Since we walk slots in UTC (not local time), each UTC slot is unique —
 * no duplicates can form. This function confirms that guarantee by checking
 * if a UTC DateTime is already present in a seen-set.
 */
export function isUniqueUtcSlot(
  utcIso: string,
  seen: Set<string>,
): boolean {
  if (seen.has(utcIso)) return false;
  seen.add(utcIso);
  return true;
}

/**
 * Returns true when a date is a DST transition day in the given timezone.
 * Useful in tests and logs to flag edge-case dates.
 */
export function isDstTransitionDay(date: string, timezone: string): boolean {
  const startOfDay = DateTime.fromISO(`${date}T00:00`, { zone: timezone });
  const endOfDay = DateTime.fromISO(`${date}T23:59`, { zone: timezone });
  return startOfDay.offset !== endOfDay.offset;
}
