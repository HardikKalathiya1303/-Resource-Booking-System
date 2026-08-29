import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  // POST /bookings — create a new booking
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.service.create(dto);
  }

  // GET /bookings/resource/:resourceId — list all bookings for a resource
  @Get('resource/:resourceId')
  findByResource(@Param('resourceId') resourceId: string) {
    return this.service.findByResource(resourceId);
  }
}
