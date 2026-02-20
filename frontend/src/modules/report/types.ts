export interface SaleUserItem {
  id: string;
  employeeCode: string;
  fullName: string;
}

export interface ReportSummary {
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationSec: number;
  avgDistanceKm: number;
  avgDurationSec: number;
}

export interface ReportTripItem {
  id: string;
  user: { id: string; fullName: string; employeeCode: string };
  status: string;
  startedAt: string;
  endedAt: string | null;
  totalDistanceKm: number | null;
  totalDurationSec: number | null;
  segmentCount: number;
  note: string | null;
}

export interface ReportFilters {
  userId: string | null;
  fromDate: string;
  toDate: string;
}
