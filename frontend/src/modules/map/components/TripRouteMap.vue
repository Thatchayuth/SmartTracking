<template>
  <div class="trip-route-map">
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>

    <q-banner v-if="error" class="bg-negative text-white q-mb-sm" rounded>
      {{ error }}
      <template #action>
        <q-btn flat label="Retry" @click="loadRoute" />
      </template>
    </q-banner>

    <GMapMap
      ref="mapRef"
      :center="mapCenter"
      :zoom="12"
      :options="mapOptions"
      style="width: 100%; height: 500px"
      @loaded="onMapReady"
    >
      <!-- Multi-segment polylines -->
      <GMapPolyline
        v-for="(segPath, idx) in segmentPaths"
        :key="idx"
        :path="segPath"
        :options="{
          strokeColor: segmentColors[idx % segmentColors.length],
          strokeOpacity: 0.9,
          strokeWeight: 4,
        }"
      />

      <!-- Start marker -->
      <GMapMarker
        v-if="startPoint"
        :position="startPoint"
        :icon="startIcon"
        title="Start"
      >
        <GMapInfoWindow>
          <div style="font-weight: bold; color: #4CAF50">
            Start
            <div style="font-size: 0.75rem; color: #666">{{ formatTime(points[0]?.recordedAt) }}</div>
          </div>
        </GMapInfoWindow>
      </GMapMarker>

      <!-- End marker -->
      <GMapMarker
        v-if="endPoint"
        :position="endPoint"
        :icon="endIcon"
        title="Stop"
      >
        <GMapInfoWindow>
          <div style="font-weight: bold; color: #F44336">
            Stop
            <div style="font-size: 0.75rem; color: #666">{{ formatTime(points[points.length - 1]?.recordedAt) }}</div>
          </div>
        </GMapInfoWindow>
      </GMapMarker>
    </GMapMap>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useTripRoute } from '../composables/useTripRoute';
import { date } from 'quasar';

const props = defineProps<{ tripId: string }>();

const {
  points, segmentPaths, startPoint, endPoint, bounds,
  loading, error, loadRoute,
} = useTripRoute(props.tripId);

const mapRef = ref<any>(null);
const mapCenter = ref({ lat: 13.7563, lng: 100.5018 });

const mapOptions = {
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const segmentColors = ['#1976D2', '#FF9800', '#4CAF50', '#E91E63', '#9C27B0', '#00BCD4'];

const startIcon = {
  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  scaledSize: { width: 40, height: 40 },
};

const endIcon = {
  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  scaledSize: { width: 40, height: 40 },
};

function fitMapBounds() {
  if (!bounds.value || !mapRef.value?.$mapObject) return;
  // eslint-disable-next-line no-undef
  const gBounds = new (window as any).google.maps.LatLngBounds(
    { lat: bounds.value.south, lng: bounds.value.west },
    { lat: bounds.value.north, lng: bounds.value.east },
  );
  mapRef.value.$mapObject.fitBounds(gBounds, 50);
}

function onMapReady() {
  if (bounds.value) fitMapBounds();
}

watch(bounds, (b) => { if (b) fitMapBounds(); });

function formatTime(iso?: string) {
  if (!iso) return '';
  return date.formatDate(iso, 'DD/MM/YYYY HH:mm:ss');
}

onMounted(() => loadRoute());
</script>

<style scoped>
.trip-route-map {
  position: relative;
  width: 100%;
}
</style>
