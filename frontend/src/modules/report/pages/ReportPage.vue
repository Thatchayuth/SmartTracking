<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Trip Report</div>

    <!-- ═══ FILTER BAR ═══ -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-3">
            <q-select
              v-model="store.filters.userId"
              :options="userOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              clearable
              outlined dense
              label="Sale"
              :loading="!store.saleUsers.length"
            >
              <template #prepend><q-icon name="person" /></template>
            </q-select>
          </div>

          <div class="col-12 col-sm-3">
            <q-input v-model="store.filters.fromDate" outlined dense label="From Date" mask="####-##-##">
              <template #prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.filters.fromDate" mask="YYYY-MM-DD">
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
            <q-input v-model="store.filters.toDate" outlined dense label="To Date" mask="####-##-##">
              <template #prepend>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="store.filters.toDate" mask="YYYY-MM-DD">
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
            <q-btn
              color="primary" icon="search" label="Search" unelevated
              @click="store.search()"
              :loading="store.loading.summary || store.loading.trips"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- ═══ SUMMARY CARDS ═══ -->
    <div class="row q-col-gutter-md q-mb-md" v-if="store.summary">
      <div class="col-12 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-icon name="directions_car" size="32px" color="primary" />
            <div class="text-h4 text-primary q-mt-sm">{{ store.summary.totalTrips }}</div>
            <div class="text-caption text-grey">Total Trips</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-icon name="straighten" size="32px" color="positive" />
            <div class="text-h4 text-positive q-mt-sm">
              {{ store.summary.totalDistanceKm }} <span class="text-subtitle2">km</span>
            </div>
            <div class="text-caption text-grey">Total Distance (avg {{ store.summary.avgDistanceKm }} km/trip)</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-icon name="schedule" size="32px" color="warning" />
            <div class="text-h4 text-warning q-mt-sm">{{ formatDuration(store.summary.totalDurationSec) }}</div>
            <div class="text-caption text-grey">Total Duration (avg {{ formatDuration(store.summary.avgDurationSec) }}/trip)</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ═══ TRIP TABLE ═══ -->
    <q-card flat bordered class="q-mb-md">
      <q-table
        flat
        :rows="store.trips"
        :columns="columns"
        row-key="id"
        :loading="store.loading.trips"
        :pagination="pagination"
        @request="onTableRequest"
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
    </q-card>

    <!-- ═══ EXPORT BUTTONS ═══ -->
    <div class="row q-gutter-md justify-end">
      <q-btn
        outline color="positive" icon="description" label="Export Excel"
        :loading="store.loading.export"
        @click="store.exportFile('excel')"
        :disable="!store.summary"
      />
      <q-btn
        outline color="negative" icon="picture_as_pdf" label="Export PDF"
        :loading="store.loading.export"
        @click="store.exportFile('pdf')"
        :disable="!store.summary"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useReportStore } from '../report.store';
import type { QTableColumn } from 'quasar';
import { date as qdate } from 'quasar';

const store = useReportStore();

const userOptions = computed(() => [
  { label: 'All Users', value: null },
  ...store.saleUsers.map((u) => ({
    label: `${u.fullName} (${u.employeeCode})`,
    value: u.id,
  })),
]);

const columns: QTableColumn[] = [
  { name: 'no',        label: '#',             field: 'id',                            align: 'center', sortable: false },
  { name: 'employee',  label: 'Sale',          field: (row) => row.user.fullName,  align: 'left', sortable: false },
  { name: 'date',      label: 'Date',          field: 'startedAt',                 align: 'center', format: (v: string) => qdate.formatDate(v, 'DD/MM/YYYY') },
  { name: 'startTime', label: 'Start',         field: 'startedAt',                 align: 'center', format: (v: string) => qdate.formatDate(v, 'HH:mm') },
  { name: 'endTime',   label: 'End',           field: 'endedAt',                   align: 'center', format: (v: string | null) => v ? qdate.formatDate(v, 'HH:mm') : '-' },
  { name: 'distance',  label: 'Distance (km)', field: 'totalDistanceKm',           align: 'right',  format: (v: number | null) => v != null ? v.toFixed(2) : '-' },
  { name: 'duration',  label: 'Duration',      field: 'totalDurationSec',          align: 'center', sortable: false },
  { name: 'status',    label: 'Status',        field: 'status',                    align: 'center' },
  { name: 'actions',   label: '',              field: 'id',                        align: 'center', sortable: false },
];

const pagination = computed(() => ({
  page: store.meta.page,
  rowsPerPage: store.meta.limit,
  rowsNumber: store.meta.total,
}));

function onTableRequest(props: { pagination?: { page?: number; rowsPerPage?: number } }) {
  const { page, rowsPerPage } = props.pagination ?? {};
  store.loadTrips(page, rowsPerPage);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function statusColor(status: string) {
  const map: Record<string, string> = { Started: 'blue', Paused: 'orange', Resumed: 'cyan', Stopped: 'grey' };
  return map[status] ?? 'grey';
}

onMounted(() => store.loadSaleUsers());
</script>
