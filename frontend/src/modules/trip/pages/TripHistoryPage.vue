<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <q-btn flat icon="arrow_back" @click="$router.back()" />
      <div class="text-h5 q-ml-sm">Trip History</div>
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.fromDate"
              outlined dense label="From Date"
              mask="####-##-##"
            >
              <template #prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover>
                    <q-date v-model="filters.fromDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" flat color="primary" />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.toDate"
              outlined dense label="To Date"
              mask="####-##-##"
            >
              <template #prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover>
                    <q-date v-model="filters.toDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" flat color="primary" />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-2">
            <q-btn color="primary" icon="search" label="Search" unelevated @click="search" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Trip Table -->
    <q-table
      flat bordered
      :rows="tripStore.trips"
      :columns="columns"
      row-key="id"
      :loading="tripStore.loading"
      :pagination="pagination"
      @request="onRequest"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusColor(props.row.status)" :label="props.row.status" />
        </q-td>
      </template>

      <template #body-cell-duration="props">
        <q-td :props="props">
          {{ props.row.totalDurationSec != null ? formatDuration(props.row.totalDurationSec) : '-' }}
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat dense round icon="map" color="primary"
            :to="{ name: 'trip-detail', params: { id: props.row.id } }"
          >
            <q-tooltip>View Route</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import { useTripStore } from '../trip.store';
import type { QTableColumn } from 'quasar';
import { date as qdate } from 'quasar';

const tripStore = useTripStore();

const filters = reactive({
  fromDate: qdate.formatDate(qdate.subtractFromDate(new Date(), { days: 30 }), 'YYYY-MM-DD'),
  toDate: qdate.formatDate(new Date(), 'YYYY-MM-DD'),
});

const columns: QTableColumn[] = [
  { name: 'date',     label: 'Date',          field: 'startedAt',        align: 'center', format: (v: string) => qdate.formatDate(v, 'DD/MM/YYYY') },
  { name: 'start',    label: 'Start',         field: 'startedAt',        align: 'center', format: (v: string) => qdate.formatDate(v, 'HH:mm') },
  { name: 'end',      label: 'End',           field: 'endedAt',          align: 'center', format: (v: string | null) => v ? qdate.formatDate(v, 'HH:mm') : '-' },
  { name: 'distance', label: 'Distance (km)', field: 'totalDistanceKm',  align: 'right',  format: (v: number | null) => v != null ? v.toFixed(2) : '-' },
  { name: 'duration', label: 'Duration',      field: 'totalDurationSec', align: 'center', sortable: false },
  { name: 'status',   label: 'Status',        field: 'status',           align: 'center' },
  { name: 'actions',  label: '',              field: 'id',               align: 'center', sortable: false },
];

const pagination = computed(() => ({
  page: tripStore.meta.page,
  rowsPerPage: tripStore.meta.limit,
  rowsNumber: tripStore.meta.total,
}));

function statusColor(status: string) {
  const map: Record<string, string> = { Started: 'blue', Paused: 'orange', Resumed: 'cyan', Stopped: 'grey' };
  return map[status] ?? 'grey';
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function search() {
  tripStore.loadTrips(1, 10, { fromDate: filters.fromDate, toDate: filters.toDate });
}

function onRequest(props: { pagination?: { page?: number; rowsPerPage?: number } }) {
  const { page, rowsPerPage } = props.pagination ?? {};
  tripStore.loadTrips(page, rowsPerPage, { fromDate: filters.fromDate, toDate: filters.toDate });
}

onMounted(() => search());
</script>
