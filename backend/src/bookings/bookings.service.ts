import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ResourcesService } from '../resources/resources.service';
import { generateSlotsForDate } from '../slots/slot-generator';
import { DateTime } from 'luxon';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly resourcesService: ResourcesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    const { resourceId, userId, startUtc, endUtc } = dto;

    const resource = await this.resourcesService.findOne(resourceId);

    const startDt = DateTime.fromISO(startUtc, { zone: 'UTC' });

    // Get the calendar date in the resource's own timezone
    const localDate = startDt.setZone(resource.timezone).toISODate();

    // Check that the requested slot falls within the resource's availability windows.
    // This is an application-level check for a clear 400 error message.
    // The real concurrency guarantee lives in the DB (see below).
    const availableSlots = generateSlotsForDate(resource, localDate);
    const slotExists = availableSlots.some(
      (s) =>
        new Date(s.startUtc).getTime() === new Date(startUtc).getTime() &&
        new Date(s.endUtc).getTime() === new Date(endUtc).getTime(),
    );

    if (!slotExists) {
      throw new BadRequestException(
        `The requested slot is outside this resource's availability window`,
      );
    }

    // -----------------------------------------------------------------------
    // Concurrency guarantee — two layers:
    //
    // Layer 1 — SELECT FOR UPDATE (pessimistic lock)
    //   Inside a transaction we lock the exact booking row (by resource_id +
    //   start_at) if one already exists.  The second concurrent request will
    //   block here until the first transaction commits, then see the row and
    //   exit with 409 rather than attempting a duplicate INSERT.
    //
    // Layer 2 — UNIQUE constraint on (resource_id, start_at)
    //   Even without the SELECT FOR UPDATE, two truly simultaneous INSERTs
    //   would race at the DB level — PostgreSQL lets only one succeed and
    //   returns error code 23505 for the other.  This is the final backstop.
    //
    // A plain SELECT-then-INSERT (no transaction, no constraint) would have a
    // TOCTOU gap where both requests pass the check and both insert — that's
    // the bug we're explicitly avoiding here.
    // -----------------------------------------------------------------------
    try {
      return await this.dataSource.transaction(async (manager) => {
        // Layer 1: try to lock an existing booking row for this slot
        const existing = await manager
          .getRepository(Booking)
          .createQueryBuilder('booking')
          .setLock('pessimistic_write') // SELECT … FOR UPDATE
          .where('booking.resourceId = :resourceId', { resourceId })
          .andWhere('booking.startAt = :startAt', { startAt: new Date(startUtc) })
          .getOne();

        if (existing) {
          throw new ConflictException(
            'This slot is already booked. Please choose a different time.',
          );
        }

        // Layer 2: INSERT — unique constraint is the final safety net
        const booking = manager.getRepository(Booking).create({
          resourceId,
          userId,
          startAt: new Date(startUtc),
          endAt: new Date(endUtc),
        });

        return manager.getRepository(Booking).save(booking);
      });
    } catch (err) {
      if (err instanceof ConflictException) throw err;

      // PostgreSQL unique violation — caught even if SELECT FOR UPDATE is bypassed
      if (err?.code === '23505') {
        throw new ConflictException(
          'This slot is already booked. Please choose a different time.',
        );
      }

      throw err;
    }
  }

  findByResource(resourceId: string): Promise<Booking[]> {
    return this.repo.find({
      where: { resourceId },
      order: { startAt: 'ASC' },
    });
  }
}
