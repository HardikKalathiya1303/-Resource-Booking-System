import { DateTime } from 'luxon';
import { Resource } from '../resources/resource.entity';
import { toUtc, weekdayInZone } from '../common/timezone.util';
import { isInSpringForwardGap, isUniqueUtcSlot } from '../common/dst.util';

export interface Slot {
  startUtc: string;   // ISO UTC string — stored in DB
  endUtc: string;     // ISO UTC string — stored in DB
  startLocal: string; // Wall-clock time in resource's timezone (display)
  endLocal: string;
}

/**
 * Generate all bookable slots for a resource on a given date.
 *
 * Steps:
 *  1. Find which day of week this date is in the resource's own timezone
 *  2. Find matching availability windows for that day
 *  3. Walk the window in slotDurationMinutes steps (in UTC — DST-safe)
 *  4. Skip spring-forward gap slots (they don't exist in local time)
 *  5. Deduplicate fall-back slots (same UTC instant can't appear twice)
 *
 * Half-open intervals: slot [09:00, 10:00) and [10:00, 11:00) never overlap.
 */
export function generateSlotsForDate(resource: Resource, date: string): Slot[] {
  const { timezone, availability, slotDurationMinutes } = resource;

  // Step 1 — get ISO weekday in the resource's timezone (1=Mon … 7=Sun)
  const dayOfWeek = weekdayInZone(date, timezone);

  // Step 2 — find windows that match this weekday
  const windows = availability.filter((w) => w.dayOfWeek === dayOfWeek);

  const slots: Slot[] = [];

  // Tracks UTC instants already added — prevents fall-back duplicates
  const seenUtc = new Set<string>();

  for (const window of windows) {
    // Convert window boundaries to UTC — Luxon applies correct DST offset
    let current = toUtc(date, window.startTime, timezone);
    const windowEnd = toUtc(date, window.endTime, timezone);

    // Walk the window in fixed UTC steps — timezone offset changes don't affect this
    while (current < windowEnd) {
      const next = current.plus({ minutes: slotDurationMinutes });

      if (next > windowEnd) break;

      const startIso = current.toISO();
      const startLocal = current.setZone(timezone).toFormat('HH:mm');

      // Guard 1 — skip if this wall-clock time is in a spring-forward gap
      // (Luxon silently shifted it, so round-trip local time won't match)
      if (isInSpringForwardGap(date, startLocal, timezone)) {
        current = next;
        continue;
      }

      // Guard 2 — skip duplicate UTC slots caused by fall-back
      if (!isUniqueUtcSlot(startIso, seenUtc)) {
        current = next;
        continue;
      }

      slots.push({
        startUtc: startIso,
        endUtc: next.toISO(),
        startLocal,
        endLocal: next.setZone(timezone).toFormat('HH:mm'),
      });

      current = next;
    }
  }

  return slots;
}

/**
 * Generate slots for a range of dates (inclusive).
 * Returns slots grouped by calendar date in the resource's timezone.
 */
export function generateSlotsForRange(
  resource: Resource,
  fromDate: string,
  toDate: string,
): Record<string, Slot[]> {
  const result: Record<string, Slot[]> = {};

  let current = DateTime.fromISO(fromDate, { zone: resource.timezone });
  const end = DateTime.fromISO(toDate, { zone: resource.timezone });

  while (current <= end) {
    const dateStr = current.toISODate();
    const slots = generateSlotsForDate(resource, dateStr);
    if (slots.length > 0) {
      result[dateStr] = slots;
    }
    current = current.plus({ days: 1 });
  }

  return result;
}
