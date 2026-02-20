import { api } from 'src/boot/axios';
import type {
  GpsPoint,
  TripDetail,
  TripListItem,
  ActiveTrip,
  StartTripResponse,
  PaginationMeta,
} from './types';

export const tripApi = {
  start(note?: string) {
    return api.post<StartTripResponse>('/api/trips/start', { note });
  },

  pause(tripId: string) {
    return api.patch<{ tripId: string; status: string }>(`/api/trips/${tripId}/pause`);
  },

  resume(tripId: string) {
    return api.patch<{ tripId: string; status: string; newSegmentId: string }>(
      `/api/trips/${tripId}/resume`,
    );
  },

  stop(tripId: string) {
    return api.patch<{
      tripId: string;
      status: string;
      endedAt: string;
      totalDistanceKm: number;
      totalDurationSec: number;
    }>(`/api/trips/${tripId}/stop`);
  },

  getActive() {
    return api.get<ActiveTrip | null>('/api/trips/active');
  },

  getList(params: Record<string, string | number>) {
    return api.get<{ data: TripListItem[]; meta: PaginationMeta }>('/api/trips', { params });
  },

  getDetail(tripId: string) {
    return api.get<TripDetail>(`/api/trips/${tripId}`);
  },

  getRoute(tripId: string) {
    return api.get<GpsPoint[]>(`/api/trips/${tripId}/route`);
  },
};
