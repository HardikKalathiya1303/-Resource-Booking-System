import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// One availability window: which day + what hours (in resource's own timezone)
export interface AvailabilityWindow {
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday (ISO)
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // IANA timezone name e.g. "Europe/London", "America/New_York"
  @Column()
  timezone: string;

  // Weekly availability stored as JSONB array
  @Column({ type: 'jsonb' })
  availability: AvailabilityWindow[];

  // Fixed slot length in minutes (60 for this system)
  @Column({ default: 60 })
  slotDurationMinutes: number;
}
