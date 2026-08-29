import { IsDateString, IsOptional, IsString, IsNotEmpty, Matches } from 'class-validator';

export class GetSlotsDto {
  // Must be a valid YYYY-MM-DD date string
  @IsDateString()
  @IsNotEmpty()
  date: string;

  // IANA timezone name e.g. "Asia/Kolkata", "Europe/London"
  // Optional — defaults to UTC in the service
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z_\/+-]+$/, {
    message: 'timezone must be a valid IANA timezone name e.g. "Europe/London"',
  })
  timezone?: string;
}
