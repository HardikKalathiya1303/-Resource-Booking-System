import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { ResourcesService } from '../resources/resources.service';
import { generateSlotsForDate } from './slot-generator';
import { DateTime } from 'luxon';

export interface SlotDto {
  startUtc: string;
  endUtc: string;
  startLocal: string;  // in resource's timezone
  endLocal: string;
  startDisplay: string; // in user's requested timezone
  endDisplay: string;
  isBooked: boolean;
  bookingId?: string;
}

@Injectable()
export class SlotsService {
  constructor(
    private readonly resourcesService: ResourcesService,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async getSlotsForDate(
    resourceId: string,
    date: string,          // "YYYY-MM-DD"
    userTimezone: string,  // IANA timezone for display — e.g. "Asia/Kolkata"
  ): Promise<SlotDto[]> {
    const resource = await this.resourcesService.findOne(resourceId);

    // Generate all possible slots for this date
    const slots = generateSlotsForDate(resource, date);

    if (slots.length === 0) return [];

    // Fetch all bookings for this resource on this date in one query
    const dayStart = new Date(slots[0].startUtc);
    const dayEnd = new Date(slots[slots.length - 1].endUtc);

    const bookings = await this.bookingRepo.find({
      where: {
        resourceId,
        startAt: Between(dayStart, dayEnd),
      },
    });

    // Index bookings by their UTC start time for O(1) lookup
    const bookedMap = new Map<string, string>();
    for (const booking of bookings) {
      bookedMap.set(booking.startAt.toISOString(), booking.id);
    }

    // Merge slot data with booking status
    return slots.map((slot) => {
      const bookingId = bookedMap.get(new Date(slot.startUtc).toISOString());

      // Convert UTC times to user's display timezone
      const startDisplay = DateTime.fromISO(slot.startUtc, { zone: 'UTC' })
        .setZone(userTimezone)
        .toFormat('HH:mm');
      const endDisplay = DateTime.fromISO(slot.endUtc, { zone: 'UTC' })
        .setZone(userTimezone)
        .toFormat('HH:mm');

      return {
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        startLocal: slot.startLocal,
        endLocal: slot.endLocal,
        startDisplay,
        endDisplay,
        isBooked: !!bookingId,
        bookingId,
      };
    });
  }
}
