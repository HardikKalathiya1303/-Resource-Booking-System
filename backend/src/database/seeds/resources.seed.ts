import { DataSource } from 'typeorm';
import { Resource } from '../../resources/resource.entity';

// Seed data for 3 resources:
//   1. London Room    — Europe/London     (observes DST: GMT in winter, BST in summer)
//   2. New York Room  — America/New_York  (observes DST: EST in winter, EDT in summer)
//   3. Kolkata Space  — Asia/Kolkata      (no DST, always UTC+5:30)
//
// Availability times are wall-clock times in each resource's own timezone.
// The slot service converts them to UTC correctly for every date, including DST changeovers.

export const SEED_RESOURCES = [
  {
    name: 'London Conference Room',
    description: 'Main meeting room — Europe/London timezone (BST/GMT)',
    timezone: 'Europe/London',
    slotDurationMinutes: 60,
    // Mon–Fri, 09:00–17:00 London time
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
  {
    name: 'New York Meeting Pod',
    description: 'Collaboration pod — America/New_York timezone (EST/EDT)',
    timezone: 'America/New_York',
    slotDurationMinutes: 60,
    // Mon–Fri, 09:00–17:00 New York time
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
  {
    name: 'Kolkata Workshop Space',
    description: 'Open workshop — Asia/Kolkata timezone (no DST, UTC+5:30)',
    timezone: 'Asia/Kolkata',
    slotDurationMinutes: 60,
    // Mon–Sat, 10:00–18:00 Kolkata time
    availability: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' },
    ],
  },
];

export async function seedResources(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Resource);

  for (const data of SEED_RESOURCES) {
    const exists = await repo.findOne({ where: { name: data.name } });
    if (!exists) {
      const resource = repo.create(data);
      await repo.save(resource);
      console.log(`Seeded: ${data.name} (${data.timezone})`);
    } else {
      console.log(`Already exists: ${data.name} — skipping`);
    }
  }
}
