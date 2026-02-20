<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Trip Control</div>

    <!-- ═══ NO ACTIVE TRIP ═══ -->
    <q-card v-if="!tripStore.hasActiveTrip" flat bordered class="q-pa-lg text-center">
      <q-icon name="directions_car" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No Active Trip</div>
      <div class="text-caption text-grey q-mb-lg">Start a new trip to track your route</div>

      <q-input
        v-model="note"
        outlined
        label="Trip Note (optional)"
        class="q-mb-md"
        style="max-width: 400px; margin: 0 auto"
      />

      <q-btn
        color="positive"
        icon="play_arrow"
        label="Start Trip"
        size="lg"
        unelevated
        :loading="tripStore.loading"
        @click="handleStart"
      />
    </q-card>

    <!-- ═══ ACTIVE TRIP ═══ -->
    <div v-else>
      <!-- Status Bar -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <q-badge
              :color="statusColor"
              :label="tripStore.tripStatus ?? ''"
              class="text-body1 q-pa-sm"
            />
            <div class="text-caption text-grey">
              Started: {{ formatDate(tripStore.activeTrip?.startedAt) }}
            </div>
            <div class="text-caption text-grey">
              Trip ID: {{ tripStore.activeTrip?.tripId.substring(0, 8) }}...
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- GPS Status -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <q-icon
              :name="gps.isTracking.value ? 'gps_fixed' : 'gps_off'"
              :color="gps.isTracking.value ? 'positive' : 'grey'"
              size="28px"
            />
            <div v-if="gps.currentPosition.value">
              <div class="text-caption">
                Lat: {{ gps.currentPosition.value.latitude.toFixed(6) }} |
                Lng: {{ gps.currentPosition.value.longitude.toFixed(6) }}
              </div>
              <div class="text-caption text-grey">
                Accuracy: {{ gps.currentPosition.value.accuracy?.toFixed(0) ?? '-' }}m |
                Speed: {{ gps.currentPosition.value.speed?.toFixed(1) ?? '-' }} m/s
              </div>
            </div>
            <div v-else class="text-caption text-grey">Waiting for GPS...</div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Control Buttons -->
      <div class="row q-gutter-md justify-center q-mt-lg">
        <!-- Pause -->
        <q-btn
          v-if="tripStore.tripStatus !== 'Paused'"
          color="warning"
          icon="pause"
          label="Pause"
          size="lg"
          unelevated
          :loading="tripStore.loading"
          @click="handlePause"
        />

        <!-- Resume -->
        <q-btn
          v-if="tripStore.isPaused"
          color="info"
          icon="play_arrow"
          label="Resume"
          size="lg"
          unelevated
          :loading="tripStore.loading"
          @click="handleResume"
        />

        <!-- Stop -->
        <q-btn
          color="negative"
          icon="stop"
          label="Stop Trip"
          size="lg"
          unelevated
          :loading="tripStore.loading"
          @click="confirmStop"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar, date as qdate } from 'quasar';
import { useTripStore } from '../trip.store';
import { useGpsTracking } from 'src/modules/gps/useGpsTracking';

const $q = useQuasar();
const tripStore = useTripStore();
const gps = useGpsTracking();
const note = ref('');

const statusColor = computed(() => {
  const map: Record<string, string> = {
    Started: 'blue', Paused: 'orange', Resumed: 'cyan', Stopped: 'grey',
  };
  return map[tripStore.tripStatus ?? ''] ?? 'grey';
});

function formatDate(iso?: string) {
  if (!iso) return '';
  return qdate.formatDate(iso, 'DD/MM/YYYY HH:mm:ss');
}

async function handleStart() {
  try {
    const result = await tripStore.startTrip(note.value || undefined);
    if (result) {
      gps.startTracking(result.tripId, result.activeSegmentId);
      note.value = '';
      $q.notify({ type: 'positive', message: 'Trip started!' });
    }
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to start trip' });
  }
}

async function handlePause() {
  try {
    await tripStore.pauseTrip();
    gps.pauseTracking();
    $q.notify({ type: 'warning', message: 'Trip paused' });
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to pause' });
  }
}

async function handleResume() {
  try {
    const result = await tripStore.resumeTrip();
    if (result) {
      gps.resumeTracking(result.newSegmentId);
      $q.notify({ type: 'positive', message: 'Trip resumed!' });
    }
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to resume' });
  }
}

function confirmStop() {
  $q.dialog({
    title: 'Stop Trip',
    message: 'Are you sure you want to stop this trip? This cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const result = await tripStore.stopTrip();
      gps.stopTracking();
      if (result) {
        $q.notify({
          type: 'positive',
          message: `Trip stopped! Distance: ${result.totalDistanceKm} km`,
        });
      }
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to stop' });
    }
  });
}

onMounted(async () => {
  await tripStore.checkActiveTrip();
  // Resume GPS tracking if there's an active trip
  if (tripStore.activeTrip && tripStore.tripStatus !== 'Paused') {
    gps.startTracking(
      tripStore.activeTrip.tripId,
      tripStore.activeTrip.activeSegmentId ?? '',
    );
  }
});
</script>
