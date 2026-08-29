import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { ResourcesModule } from '../resources/resources.module';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    ResourcesModule, // gives access to ResourcesService
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
