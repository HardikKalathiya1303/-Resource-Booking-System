import { Controller, Get, Param, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { GetSlotsDto } from './dto/get-slots.dto';

@Controller('resources/:resourceId/slots')
export class SlotsController {
  constructor(private readonly service: SlotsService) {}

  // GET /resources/:resourceId/slots?date=2025-06-15&timezone=Asia/Kolkata
  @Get()
  async getSlots(
    @Param('resourceId') resourceId: string,
    @Query() query: GetSlotsDto,
  ) {
    const userTimezone = query.timezone || 'UTC';

    const slots = await this.service.getSlotsForDate(
      resourceId,
      query.date,
      userTimezone,
    );

    return {
      resourceId,
      date: query.date,
      userTimezone,
      slots,
    };
  }
}
