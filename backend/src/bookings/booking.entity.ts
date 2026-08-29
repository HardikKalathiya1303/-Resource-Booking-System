import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Resource } from '../resources/resource.entity';

@Entity('bookings')
// DB-level unique constraint: one booking per (resource, slot start time)
// This is what prevents double-booking — enforced by PostgreSQL, not app code
@Index('UQ_booking_resource_start', ['resourceId', 'startAt'], { unique: true })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @ManyToOne(() => Resource)
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  // Simple userId — no auth required per task spec
  @Column({ name: 'user_id' })
  userId: string;

  // Always stored in UTC (timestamptz). Never store wall-clock time as UTC.
  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
