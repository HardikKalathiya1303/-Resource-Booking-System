import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResources1001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                  VARCHAR(255) NOT NULL,
        description           TEXT,
        timezone              VARCHAR(100) NOT NULL,
        availability          JSONB NOT NULL DEFAULT '[]',
        "slotDurationMinutes" INTEGER NOT NULL DEFAULT 60
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS resources;`);
  }
}
