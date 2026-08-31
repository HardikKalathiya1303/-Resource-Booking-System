import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookings1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_id UUID NOT NULL REFERENCES resources(id),
        user_id     VARCHAR(255) NOT NULL,
        start_at    TIMESTAMPTZ NOT NULL,
        end_at      TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        -- This unique constraint is the core no-double-booking guarantee.
        -- PostgreSQL enforces it atomically, so even two concurrent INSERTs
        -- for the same (resource, start_at) will result in exactly one success
        -- and one error — no application-level race condition possible.
        CONSTRAINT UQ_booking_resource_start UNIQUE (resource_id, start_at)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_bookings_resource_start ON bookings (resource_id, start_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS bookings;`);
  }
}
