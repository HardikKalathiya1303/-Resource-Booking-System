import { generateSlotsForDate } from './slot-generator';
import { isDstTransitionDay } from '../common/dst.util';
import { Resource } from '../resources/resource.entity';

// A minimal Resource object — only the fields the generator uses
function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'test-id',
    name: 'Test Room',
    description: '',
    timezone: 'Europe/London',
    slotDurationMinutes: 60,
    availability: [
      // Mon–Fri 09:00–17:00
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
    ...overrides,
  } as Resource;
}

describe('generateSlotsForDate — London room (Europe/London)', () => {
  const londonRoom = makeResource();

  // ─── Normal days ────────────────────────────────────────────────────────────

  it('generates 8 slots on a normal winter weekday (GMT = UTC+0)', () => {
    // 2025-01-06 Monday, London is GMT (UTC+0)
    const slots = generateSlotsForDate(londonRoom, '2025-01-06');

    expect(slots).toHaveLength(8);
    // First slot: 09:00 GMT = 09:00 UTC
    expect(slots[0].startUtc).toBe('2025-01-06T09:00:00.000Z');
    expect(slots[0].startLocal).toBe('09:00');
    // Last slot: 16:00 GMT = 16:00 UTC
    expect(slots[7].startUtc).toBe('2025-01-06T16:00:00.000Z');
    expect(slots[7].endLocal).toBe('17:00');
  });

  it('generates 8 slots on a normal summer weekday (BST = UTC+1)', () => {
    // 2025-06-16 Monday, London is BST (UTC+1)
    const slots = generateSlotsForDate(londonRoom, '2025-06-16');

    expect(slots).toHaveLength(8);
    // First slot: 09:00 BST = 08:00 UTC
    expect(slots[0].startUtc).toBe('2025-06-16T08:00:00.000Z');
    expect(slots[0].startLocal).toBe('09:00');
    // Last slot: 16:00 BST = 15:00 UTC
    expect(slots[7].startUtc).toBe('2025-06-16T15:00:00.000Z');
    expect(slots[7].endLocal).toBe('17:00');
  });

  it('returns no slots on a weekend', () => {
    // 2025-01-11 Saturday
    const slots = generateSlotsForDate(londonRoom, '2025-01-11');
    expect(slots).toHaveLength(0);
  });

  // ─── Spring-forward (2025-03-30) ────────────────────────────────────────────
  // UK clocks go forward from GMT to BST at 01:00 on the last Sunday of March.
  // 09:00–17:00 is well after the transition so all 8 slots exist.
  // After the transition, 09:00 London = 08:00 UTC (BST offset).

  it('correctly identifies 2025-03-30 as a DST transition day', () => {
    expect(isDstTransitionDay('2025-03-30', 'Europe/London')).toBe(true);
  });

  it('generates 8 slots on spring-forward day with correct UTC offset (BST)', () => {
    // 2025-03-30 Sunday — but let's use a resource that works on Sunday for this test
    const sundayResource = makeResource({
      availability: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }],
    });
    const slots = generateSlotsForDate(sundayResource, '2025-03-30');

    // After spring-forward: 09:00 BST = 08:00 UTC
    expect(slots).toHaveLength(8);
    expect(slots[0].startUtc).toBe('2025-03-30T08:00:00.000Z');
    expect(slots[0].startLocal).toBe('09:00');
    expect(slots[7].endLocal).toBe('17:00');
  });

  it('generates no gaps or duplicates on spring-forward day', () => {
    const sundayResource = makeResource({
      availability: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }],
    });
    const slots = generateSlotsForDate(sundayResource, '2025-03-30');

    // Each slot's endUtc must equal the next slot's startUtc (no gaps, no overlaps)
    for (let i = 0; i < slots.length - 1; i++) {
      expect(slots[i].endUtc).toBe(slots[i + 1].startUtc);
    }

    // All UTC start times must be unique
    const utcStarts = slots.map((s) => s.startUtc);
    expect(new Set(utcStarts).size).toBe(utcStarts.length);
  });

  // ─── Fall-back (2025-10-26) ──────────────────────────────────────────────────
  // UK clocks go back from BST to GMT at 02:00 on the last Sunday of October.
  // 09:00–17:00 is after the transition so all slots are in GMT.
  // No duplicate UTC slots should appear.

  it('correctly identifies 2025-10-26 as a DST transition day', () => {
    expect(isDstTransitionDay('2025-10-26', 'Europe/London')).toBe(true);
  });

  it('generates 8 slots on fall-back day with correct UTC offset (GMT)', () => {
    const sundayResource = makeResource({
      availability: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }],
    });
    const slots = generateSlotsForDate(sundayResource, '2025-10-26');

    // After fall-back: 09:00 GMT = 09:00 UTC
    expect(slots).toHaveLength(8);
    expect(slots[0].startUtc).toBe('2025-10-26T09:00:00.000Z');
    expect(slots[0].startLocal).toBe('09:00');
  });

  it('produces no duplicate UTC slots on fall-back day', () => {
    const sundayResource = makeResource({
      availability: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }],
    });
    const slots = generateSlotsForDate(sundayResource, '2025-10-26');

    const utcStarts = slots.map((s) => s.startUtc);
    expect(new Set(utcStarts).size).toBe(utcStarts.length);
  });
});

// ─── Cross-timezone: Kolkata room ─────────────────────────────────────────────

describe('generateSlotsForDate — Kolkata room (Asia/Kolkata, no DST)', () => {
  const kolkataRoom = makeResource({
    timezone: 'Asia/Kolkata',
    availability: [
      // Mon–Fri 10:00–18:00
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
  });

  it('generates 8 slots with UTC offset of -5:30 (IST = UTC+5:30)', () => {
    // 2025-01-06 Monday
    const slots = generateSlotsForDate(kolkataRoom, '2025-01-06');

    expect(slots).toHaveLength(8);
    // 10:00 IST = 04:30 UTC
    expect(slots[0].startUtc).toBe('2025-01-06T04:30:00.000Z');
    expect(slots[0].startLocal).toBe('10:00');
    // 17:00 IST = 11:30 UTC
    expect(slots[7].startUtc).toBe('2025-01-06T11:30:00.000Z');
    expect(slots[7].endLocal).toBe('18:00');
  });

  it('is never a DST transition day', () => {
    // Kolkata does not observe DST — should always be false
    expect(isDstTransitionDay('2025-03-30', 'Asia/Kolkata')).toBe(false);
    expect(isDstTransitionDay('2025-10-26', 'Asia/Kolkata')).toBe(false);
  });
});
