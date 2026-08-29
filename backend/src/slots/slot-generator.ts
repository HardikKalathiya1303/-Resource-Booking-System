import { DateTime } from 'luxon';
import { Resource } from '../resources/resource.entity';
import { toUtc, weekdayInZone } from '../common/timezone.util';

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
 *  3. Walk the window in slotDurationMinutes steps
 *  4. Convert each slot boundary from local time to UTC via Luxon (DST-safe)
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

  for (const window of windows) {
    // Step 3 — convert window boundaries to UTC DateTime via Luxon
    let current = toUtc(date, window.startTime, timezone);
    const windowEnd = toUtc(date, window.endTime, timezone);

    // Step 4 — walk the window in fixed steps
    while (current < windowEnd) {
      const next = current.plus({ minutes: slotDurationMinutes });

      // Only include slot if it fits completely inside the window
      if (next > windowEnd) break;

      slots.push({
        startUtc: current.toISO(),
        endUtc: next.toISO(),
        startLocal: current.setZone(timezone).toFormat('HH:mm'),
        endLocal: next.setZone(timezone).toFormat('HH:mm'),
      });

      current = next;
    }
  }

  return slots;
}

/**
 * Generate slots for a range of dates (inclusive).
 * Returns a flat list grouped by date in the resource's timezone.
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
