<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <q-btn flat icon="arrow_back" @click="$router.back()" />
      <div class="text-h5 q-ml-sm">Trip Detail</div>
    </div>

    <q-card flat bordered class="q-mb-md" v-if="trip">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Sale</div>
            <div class="text-body1">{{ trip.user.fullName }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Status</div>
            <q-badge :color="statusColor" :label="trip.status" />
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Distance</div>
            <div class="text-body1">{{ trip.totalDistance?.toFixed(2) ?? '-' }} km</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Duration</div>
            <div class="text-body1">{{ trip.totalDuration ? formatDuration(trip.totalDuration) : '-' }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-card-section>
        <TripRouteMap :trip-id="tripId" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { tripApi } from 'src/modules/trip/trip.api';
import type { TripDetail } from 'src/modules/trip/types';
import TripRouteMap from 'src/modules/map/components/TripRouteMap.vue';

const route = useRoute();
const tripId = route.params.id as string;
const trip = ref<TripDetail | null>(null);

const statusColor = computed(() => {
  const map: Record<string, string> = { Started: 'blue', Paused: 'orange', Resumed: 'cyan', Stopped: 'grey' };
  return map[trip.value?.status ?? ''] ?? 'grey';
});

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

onMounted(async () => {
  const { data } = await tripApi.getDetail(tripId);
  trip.value = data;
});
</script>
