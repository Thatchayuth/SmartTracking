<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">User Management</div>
      <q-btn color="primary" icon="person_add" label="Add User" unelevated @click="openCreateDialog" />
    </div>

    <!-- Search -->
    <q-input
      v-model="search"
      outlined dense clearable
      placeholder="Search by name, code, or email..."
      class="q-mb-md" style="max-width: 400px"
      @keyup.enter="loadUsers"
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>

    <!-- Table -->
    <q-table
      flat bordered
      :rows="users"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="props.row.isActive ? 'positive' : 'negative'" :label="props.row.isActive ? 'Active' : 'Inactive'" />
        </q-td>
      </template>

      <template #body-cell-roles="props">
        <q-td :props="props">
          <q-badge v-for="role in props.row.roles" :key="role" :label="role" color="primary" class="q-mr-xs" />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense round icon="edit" color="primary" @click="openEditDialog(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat dense round icon="admin_panel_settings" color="info" @click="openRoleDialog(props.row)">
            <q-tooltip>Assign Roles</q-tooltip>
          </q-btn>
          <q-btn
            v-if="props.row.isActive"
            flat dense round icon="block" color="negative"
            @click="deactivateUser(props.row)"
          >
            <q-tooltip>Deactivate</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showUserDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingUser ? 'Edit User' : 'Create User' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="saveUser" class="q-gutter-sm">
            <q-input
              v-if="!editingUser"
              v-model="form.employeeCode"
              outlined dense label="Employee Code"
              :rules="[v => !!v || 'Required']"
            />
            <q-input v-model="form.fullName" outlined dense label="Full Name" :rules="[v => !!v || 'Required']" />
            <q-input v-model="form.email" outlined dense label="Email" type="email" :rules="[v => !!v || 'Required']" />
            <q-input
              v-if="!editingUser"
              v-model="form.password"
              outlined dense label="Password" type="password"
              :rules="[v => !!v || 'Required', v => v.length >= 6 || 'Min 6 chars']"
            />
            <q-input v-model="form.phone" outlined dense label="Phone" />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn type="submit" color="primary" label="Save" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Role Assignment Dialog -->
    <q-dialog v-model="showRoleDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Assign Roles — {{ roleTarget?.fullName }}</div>
        </q-card-section>
        <q-card-section>
          <q-option-group
            v-model="selectedRoles"
            :options="roleOptions"
            type="checkbox"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save Roles" unelevated @click="saveRoles" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { userApi, type UserItem } from '../user.api';
import type { QTableColumn } from 'quasar';
import { date as qdate } from 'quasar';
import type { PaginationMeta } from 'src/modules/trip/types';

const $q = useQuasar();

const users = ref<UserItem[]>([]);
const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
const loading = ref(false);
const saving = ref(false);
const search = ref('');

// User Dialog
const showUserDialog = ref(false);
const editingUser = ref<UserItem | null>(null);
const form = reactive({ employeeCode: '', fullName: '', email: '', password: '', phone: '' });

// Role Dialog
const showRoleDialog = ref(false);
const roleTarget = ref<UserItem | null>(null);
const selectedRoles = ref<string[]>([]);

const roleOptions = [
  { label: 'Admin', value: 'Admin' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Sale', value: 'Sale' },
];

const columns: QTableColumn[] = [
  { name: 'employeeCode', label: 'Code',    field: 'employeeCode', align: 'left' },
  { name: 'fullName',     label: 'Name',    field: 'fullName',     align: 'left' },
  { name: 'email',        label: 'Email',   field: 'email',        align: 'left' },
  { name: 'phone',        label: 'Phone',   field: 'phone',        align: 'left', format: (v: string | null) => v ?? '-' },
  { name: 'roles',        label: 'Roles',   field: 'roles',        align: 'left', sortable: false },
  { name: 'status',       label: 'Status',  field: 'isActive',     align: 'center' },
  { name: 'created',      label: 'Created', field: 'createdAt',    align: 'center', format: (v: string) => qdate.formatDate(v, 'DD/MM/YYYY') },
  { name: 'actions',      label: '',        field: 'id',           align: 'center', sortable: false },
];

const pagination = computed(() => ({
  page: meta.value.page,
  rowsPerPage: meta.value.limit,
  rowsNumber: meta.value.total,
}));

async function loadUsers(page = 1, limit = 20) {
  loading.value = true;
  try {
    const { data } = await userApi.getList({ page, limit, ...(search.value ? { search: search.value } : {}) });
    users.value = data.data;
    meta.value = data.meta;
  } finally {
    loading.value = false;
  }
}

function onRequest(props: { pagination?: { page?: number; rowsPerPage?: number } }) {
  const { page, rowsPerPage } = props.pagination ?? {};
  loadUsers(page, rowsPerPage);
}

function openCreateDialog() {
  editingUser.value = null;
  Object.assign(form, { employeeCode: '', fullName: '', email: '', password: '', phone: '' });
  showUserDialog.value = true;
}

function openEditDialog(user: UserItem) {
  editingUser.value = user;
  Object.assign(form, { fullName: user.fullName, email: user.email, phone: user.phone ?? '' });
  showUserDialog.value = true;
}

async function saveUser() {
  saving.value = true;
  try {
    if (editingUser.value) {
      await userApi.update(editingUser.value.id, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
      });
      $q.notify({ type: 'positive', message: 'User updated' });
    } else {
      await userApi.create({
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      $q.notify({ type: 'positive', message: 'User created' });
    }
    showUserDialog.value = false;
    loadUsers();
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to save' });
  } finally {
    saving.value = false;
  }
}

function openRoleDialog(user: UserItem) {
  roleTarget.value = user;
  selectedRoles.value = [...user.roles];
  showRoleDialog.value = true;
}

async function saveRoles() {
  if (!roleTarget.value) return;
  saving.value = true;
  try {
    await userApi.assignRoles(roleTarget.value.id, selectedRoles.value);
    $q.notify({ type: 'positive', message: 'Roles updated' });
    showRoleDialog.value = false;
    loadUsers();
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed to assign roles' });
  } finally {
    saving.value = false;
  }
}

async function deactivateUser(user: UserItem) {
  $q.dialog({
    title: 'Deactivate User',
    message: `Deactivate ${user.fullName}?`,
    cancel: true,
  }).onOk(async () => {
    try {
      await userApi.deactivate(user.id);
      $q.notify({ type: 'positive', message: 'User deactivated' });
      loadUsers();
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e.response?.data?.message || 'Failed' });
    }
  });
}

// Init
loadUsers();
</script>
