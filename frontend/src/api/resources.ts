import api from './client';
import type { Resource, SlotsResponse, Booking } from '../types';

export async function fetchResources(): Promise<Resource[]> {
  const res = await api.get<Resource[]>('/resources');
  return res.data;
}

export async function fetchSlots(
  resourceId: string,
  date: string,
  timezone: string,
): Promise<SlotsResponse> {
  const res = await api.get<SlotsResponse>(`/resources/${resourceId}/slots`, {
    params: { date, timezone },
  });
  return res.data;
}

export async function createBooking(
  resourceId: string,
  userId: string,
  startUtc: string,
  endUtc: string,
): Promise<Booking> {
  const res = await api.post<Booking>('/bookings', {
    resourceId,
    userId,
    startUtc,
    endUtc,
  });
  return res.data;
}
