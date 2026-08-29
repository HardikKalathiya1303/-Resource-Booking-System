import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    const { resourceId, userId, startUtc, endUtc } = dto;

    const resource = await this.resourcesService.findOne(resourceId);

    const startDt = DateTime.fromISO(startUtc, { zone: 'UTC' });
    const endDt = DateTime.fromISO(endUtc, { zone: 'UTC' });

    // Get the calendar date in the resource's timezone
    const localDate = startDt.setZone(resource.timezone).toISODate();

    // Validate the requested slot exists in the resource's availability
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

    // Attempt INSERT — PostgreSQL unique constraint on (resource_id, start_at)
    // guarantees only one booking per slot even under concurrent requests.
    // If a duplicate arrives, the DB throws a unique violation which we catch as 409.
    const booking = this.repo.create({
      resourceId,
      userId,
      startAt: new Date(startUtc),
      endAt: new Date(endUtc),
    });

    try {
      return await this.repo.save(booking);
    } catch (err) {
      // PostgreSQL unique violation error code
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
