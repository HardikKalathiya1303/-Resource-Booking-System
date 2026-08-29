import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  // Simple userId — no auth required per task spec
  @IsString()
  @IsNotEmpty()
  userId: string;

  // UTC ISO string — e.g. "2025-06-15T09:00:00.000Z"
  @IsDateString()
  startUtc: string;

  @IsDateString()
  endUtc: string;
}
