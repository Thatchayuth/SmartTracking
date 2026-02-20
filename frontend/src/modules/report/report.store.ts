import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { reportApi } from './report.api';
import type { SaleUserItem, ReportSummary, ReportTripItem, ReportFilters } from './types';
import type { PaginationMeta } from 'src/modules/trip/types';
import { date } from 'quasar';

export const useReportStore = defineStore('report', () => {
  const saleUsers = ref<SaleUserItem[]>([]);
  const summary = ref<ReportSummary | null>(null);
  const trips = ref<ReportTripItem[]>([]);
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const loading = reactive({ summary: false, trips: false, export: false });
  const filters = reactive<ReportFilters>({
    userId: null,
    fromDate: date.formatDate(date.subtractFromDate(new Date(), { days: 30 }), 'YYYY-MM-DD'),
    toDate: date.formatDate(new Date(), 'YYYY-MM-DD'),
  });

  function buildParams() {
    const params: Record<string, string> = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
    if (filters.userId) params.userId = filters.userId;
    return params;
  }

  async function loadSaleUsers() {
    const { data } = await reportApi.getSaleUsers();
    saleUsers.value = data;
  }

  async function loadSummary() {
    loading.summary = true;
    try {
      const { data } = await reportApi.getSummary(buildParams());
      summary.value = data;
    } finally {
      loading.summary = false;
    }
  }

  async function loadTrips(page = 1, limit = 10) {
    loading.trips = true;
    try {
      const { data } = await reportApi.getTrips({
        ...buildParams(),
        page,
        limit,
        sortBy: 'startedAt',
        sortOrder: 'desc',
      });
      trips.value = data.data;
      meta.value = data.meta;
    } finally {
      loading.trips = false;
    }
  }

  async function search() {
    await Promise.all([loadSummary(), loadTrips(1)]);
  }

  async function exportFile(type: 'excel' | 'pdf') {
    loading.export = true;
    try {
      const params = buildParams();
      const { data } =
        type === 'excel'
          ? await reportApi.downloadExcel(params)
          : await reportApi.downloadPdf(params);

      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${filters.fromDate}_${filters.toDate}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      loading.export = false;
    }
  }

  return {
    saleUsers, summary, trips, meta, loading, filters,
    loadSaleUsers, loadSummary, loadTrips, search, exportFile,
  };
});
