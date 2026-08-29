import { MigrationInterface, QueryRunner } from 'typeorm';

// Seed data inserted via migration so it runs automatically on `migrationsRun: true`
// dayOfWeek: 1=Monday … 7=Sunday (ISO 8601)

export class SeedResources1003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO resources (name, description, timezone, availability, "slotDurationMinutes")
      VALUES
        (
          'London Conference Room',
          'Main meeting room — Europe/London timezone (BST/GMT)',
          'Europe/London',
          '[
            {"dayOfWeek":1,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":2,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":3,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":4,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":5,"startTime":"09:00","endTime":"17:00"}
          ]',
          60
        ),
        (
          'New York Meeting Pod',
          'Collaboration pod — America/New_York timezone (EST/EDT)',
          'America/New_York',
          '[
            {"dayOfWeek":1,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":2,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":3,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":4,"startTime":"09:00","endTime":"17:00"},
            {"dayOfWeek":5,"startTime":"09:00","endTime":"17:00"}
          ]',
          60
        ),
        (
          'Kolkata Workshop Space',
          'Open workshop — Asia/Kolkata timezone (no DST, UTC+5:30)',
          'Asia/Kolkata',
          '[
            {"dayOfWeek":1,"startTime":"10:00","endTime":"18:00"},
            {"dayOfWeek":2,"startTime":"10:00","endTime":"18:00"},
            {"dayOfWeek":3,"startTime":"10:00","endTime":"18:00"},
            {"dayOfWeek":4,"startTime":"10:00","endTime":"18:00"},
            {"dayOfWeek":5,"startTime":"10:00","endTime":"18:00"},
            {"dayOfWeek":6,"startTime":"10:00","endTime":"14:00"}
          ]',
          60
        )
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM resources
      WHERE name IN (
        'London Conference Room',
        'New York Meeting Pod',
        'Kolkata Workshop Space'
      );
    `);
  }
}
