import { ref, computed } from 'vue';
import { tripApi } from 'src/modules/trip/trip.api';
import type { GpsPoint } from 'src/modules/trip/types';

export function useTripRoute(tripId: string) {
  const points = ref<GpsPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadRoute() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await tripApi.getRoute(tripId);
      points.value = data;
    } catch (e: any) {
      error.value = e.message || 'Failed to load route';
    } finally {
      loading.value = false;
    }
  }

  // Full path as LatLng[]
  const path = computed(() =>
    points.value.map((p) => ({ lat: p.latitude, lng: p.longitude })),
  );

  // Segment-grouped paths for multi-color polylines
  const segmentPaths = computed(() => {
    const groups = new Map<string, { lat: number; lng: number }[]>();
    for (const p of points.value) {
      if (!groups.has(p.segmentId)) groups.set(p.segmentId, []);
      groups.get(p.segmentId)!.push({ lat: p.latitude, lng: p.longitude });
    }
    return Array.from(groups.values());
  });

  const startPoint = computed(() => {
    if (points.value.length === 0) return null;
    const p = points.value[0];
    return { lat: p.latitude, lng: p.longitude };
  });

  const endPoint = computed(() => {
    if (points.value.length < 2) return null;
    const p = points.value[points.value.length - 1];
    return { lat: p.latitude, lng: p.longitude };
  });

  const bounds = computed(() => {
    if (points.value.length === 0) return null;
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    for (const p of points.value) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    return { south: minLat, north: maxLat, west: minLng, east: maxLng };
  });

  return { points, path, segmentPaths, startPoint, endPoint, bounds, loading, error, loadRoute };
}
