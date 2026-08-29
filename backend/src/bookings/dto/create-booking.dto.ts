import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  resourceId: string;

  // Simple userId — no auth required per task spec
  @IsString()
  @IsNotEmpty()
  userId: string;

  // UTC ISO 8601 string — e.g. "2025-06-15T09:00:00.000Z"
  @IsDateString()
  startUtc: string;

  @IsDateString()
  endUtc: string;
}
