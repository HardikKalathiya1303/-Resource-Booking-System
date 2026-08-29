import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * Concurrent Booking Integration Test
 *
 * Proves the no-double-booking guarantee by firing two parallel POST /bookings
 * requests for the exact same slot and asserting:
 *   - Exactly one request succeeds (HTTP 201)
 *   - Exactly one request fails    (HTTP 409 Conflict)
 *   - Exactly one row exists in the database
 *
 * Requires a running PostgreSQL instance (use docker-compose up postgres).
 * Run with: npm run test:e2e
 */
describe('Concurrent Booking (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let resourceId: string;

  // A known available slot — Monday 09:00 UTC for London room (GMT, no DST in January)
  // London is UTC+0 in January, so 09:00 UTC = 09:00 London (within 09:00-17:00 window)
  const TEST_DATE = '2025-01-06'; // Monday
  const SLOT_START = '2025-01-06T09:00:00.000Z';
  const SLOT_END   = '2025-01-06T10:00:00.000Z';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Get the seeded London Conference Room
    const result = await dataSource.query(
      `SELECT id FROM resources WHERE name = 'London Conference Room' LIMIT 1`,
    );

    if (!result.length) {
      throw new Error(
        'Seed data not found. Run migrations first: docker-compose up postgres',
      );
    }

    resourceId = result[0].id;
  });

  afterAll(async () => {
    // Clean up test bookings so the test is repeatable
    await dataSource.query(
      `DELETE FROM bookings WHERE resource_id = $1 AND start_at = $2`,
      [resourceId, SLOT_START],
    );
    await app.close();
  });

  it('should allow only one booking when two requests race for the same slot', async () => {
    // Fire two requests at exactly the same time using Promise.all
    const [responseA, responseB] = await Promise.all([
      request(app.getHttpServer())
        .post('/bookings')
        .send({ resourceId, userId: 'user-A', startUtc: SLOT_START, endUtc: SLOT_END }),

      request(app.getHttpServer())
        .post('/bookings')
        .send({ resourceId, userId: 'user-B', startUtc: SLOT_START, endUtc: SLOT_END }),
    ]);

    const statuses = [responseA.status, responseB.status].sort();

    // Exactly one must succeed and one must fail
    expect(statuses).toEqual([201, 409]);

    // The 409 body must explain the conflict clearly
    const failed = responseA.status === 409 ? responseA : responseB;
    expect(failed.body.statusCode).toBe(409);
    expect(failed.body.message).toMatch(/already booked/i);

    // Verify only one row was written to the database
    const rows = await dataSource.query(
      `SELECT id FROM bookings WHERE resource_id = $1 AND start_at = $2`,
      [resourceId, SLOT_START],
    );
    expect(rows).toHaveLength(1);
  });
});
