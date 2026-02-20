import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tripApi } from './trip.api';
import type { TripStatus, ActiveTrip, TripListItem, PaginationMeta } from './types';

export const useTripStore = defineStore('trip', () => {
  // ─── State ───
  const activeTrip = ref<ActiveTrip | null>(null);
  const trips = ref<TripListItem[]>([]);
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const loading = ref(false);

  // ─── Getters ───
  const hasActiveTrip = computed(() => !!activeTrip.value);
  const tripStatus = computed((): TripStatus | null => activeTrip.value?.status ?? null);
  const isPaused = computed(() => activeTrip.value?.status === 'Paused');

  // ─── Actions ───
  async function checkActiveTrip() {
    try {
      const { data } = await tripApi.getActive();
      activeTrip.value = data;
    } catch {
      activeTrip.value = null;
    }
  }

  async function startTrip(note?: string) {
    loading.value = true;
    try {
      const { data } = await tripApi.start(note);
      activeTrip.value = {
        tripId: data.tripId,
        status: data.status,
        startedAt: data.startedAt,
        activeSegmentId: data.activeSegmentId,
      };
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function pauseTrip() {
    if (!activeTrip.value) return;
    loading.value = true;
    try {
      const { data } = await tripApi.pause(activeTrip.value.tripId);
      activeTrip.value = { ...activeTrip.value, status: data.status as TripStatus, activeSegmentId: null };
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function resumeTrip() {
    if (!activeTrip.value) return;
    loading.value = true;
    try {
      const { data } = await tripApi.resume(activeTrip.value.tripId);
      activeTrip.value = {
        ...activeTrip.value,
        status: data.status as TripStatus,
        activeSegmentId: data.newSegmentId,
      };
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function stopTrip() {
    if (!activeTrip.value) return;
    loading.value = true;
    try {
      const { data } = await tripApi.stop(activeTrip.value.tripId);
      activeTrip.value = null;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function loadTrips(page = 1, limit = 10, filters: Record<string, string> = {}) {
    loading.value = true;
    try {
      const { data } = await tripApi.getList({ page, limit, ...filters });
      trips.value = data.data;
      meta.value = data.meta;
    } finally {
      loading.value = false;
    }
  }

  return {
    activeTrip,
    trips,
    meta,
    loading,
    hasActiveTrip,
    tripStatus,
    isPaused,
    checkActiveTrip,
    startTrip,
    pauseTrip,
    resumeTrip,
    stopTrip,
    loadTrips,
  };
});
