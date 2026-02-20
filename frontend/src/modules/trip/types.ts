export interface GpsPoint {
  id: string;
  tripId: string;
  segmentId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recordedAt: string;
}

export interface TripSegment {
  id: string;
  tripId: string;
  segmentOrder: number;
  status: 'Active' | 'Closed';
  startedAt: string;
  endedAt: string | null;
}

export interface TripDetail {
  id: string;
  userId: string;
  user: { id: string; fullName: string; employeeCode: string };
  status: TripStatus;
  startedAt: string;
  endedAt: string | null;
  totalDistance: number | null;
  totalDuration: number | null;
  note: string | null;
  segments: TripSegment[];
}

export interface TripListItem {
  id: string;
  user: { id: string; fullName: string; employeeCode: string };
  status: TripStatus;
  startedAt: string;
  endedAt: string | null;
  totalDistanceKm: number | null;
  totalDurationSec: number | null;
  segmentCount: number;
  note: string | null;
}

export interface ActiveTrip {
  tripId: string;
  status: TripStatus;
  startedAt: string;
  activeSegmentId: string | null;
}

export interface StartTripResponse {
  tripId: string;
  status: TripStatus;
  startedAt: string;
  activeSegmentId: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type TripStatus = 'Started' | 'Paused' | 'Resumed' | 'Stopped';
