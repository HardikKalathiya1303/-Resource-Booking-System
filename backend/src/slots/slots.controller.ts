import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { DateTime } from 'luxon';

@Controller('resources/:resourceId/slots')
export class SlotsController {
  constructor(private readonly service: SlotsService) {}

  // GET /resources/:resourceId/slots?date=2025-06-15&timezone=Asia/Kolkata
  @Get()
  async getSlots(
    @Param('resourceId') resourceId: string,
    @Query('date') date: string,
    @Query('timezone') timezone: string,
  ) {
    if (!date || !DateTime.fromISO(date).isValid) {
      throw new BadRequestException('date query param must be a valid YYYY-MM-DD string');
    }

    // Default to UTC if no user timezone provided
    const userTimezone = timezone || 'UTC';

    const slots = await this.service.getSlotsForDate(resourceId, date, userTimezone);

    return {
      resourceId,
      date,
      userTimezone,
      slots,
    };
  }
}
