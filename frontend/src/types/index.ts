export interface AvailabilityWindow {
  dayOfWeek: number; // 1=Mon … 7=Sun
  startTime: string;
  endTime: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  timezone: string;
  slotDurationMinutes: number;
  availability: AvailabilityWindow[];
}

export interface Slot {
  startUtc: string;
  endUtc: string;
  startLocal: string;  // in resource's timezone
  endLocal: string;
  startDisplay: string; // in user's chosen timezone
  endDisplay: string;
  isBooked: boolean;
  bookingId?: string;
}

export interface SlotsResponse {
  resourceId: string;
  date: string;
  userTimezone: string;
  slots: Slot[];
}

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
