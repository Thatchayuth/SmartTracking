import { api } from 'src/boot/axios';
import type { SaleUserItem, ReportSummary, ReportTripItem } from './types';
import type { PaginationMeta } from 'src/modules/trip/types';

export const reportApi = {
  getSaleUsers() {
    return api.get<SaleUserItem[]>('/api/users/sales');
  },

  getSummary(params: Record<string, string>) {
    return api.get<ReportSummary>('/api/reports/summary', { params });
  },

  getTrips(params: Record<string, string | number>) {
    return api.get<{ data: ReportTripItem[]; meta: PaginationMeta }>(
      '/api/reports/trips',
      { params },
    );
  },

  downloadExcel(params: Record<string, string>) {
    return api.get('/api/reports/export/excel', {
      params,
      responseType: 'blob',
    });
  },

  downloadPdf(params: Record<string, string>) {
    return api.get('/api/reports/export/pdf', {
      params,
      responseType: 'blob',
    });
  },
};
