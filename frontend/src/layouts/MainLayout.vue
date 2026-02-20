<template>
  <q-layout view="lHh Lpr lFf">
    <!-- ─── Top Navbar ─────────────────────────────── -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <q-icon name="gps_fixed" class="q-mr-sm" />
          Smart Tracking
        </q-toolbar-title>

        <!-- User info -->
        <div class="row items-center q-gutter-sm">
          <q-chip
            v-for="role in auth.roles"
            :key="role"
            :color="roleColor(role)"
            text-color="white"
            size="sm"
            dense
          >
            {{ role }}
          </q-chip>

          <q-btn flat round icon="person">
            <q-menu>
              <q-list style="min-width: 200px">
                <q-item-label header>
                  {{ auth.fullName }}
                </q-item-label>

                <q-separator />

                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section>ออกจากระบบ</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ─── Sidebar ────────────────────────────────── -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-weight-bold text-h6 q-py-md">
          <q-icon name="gps_fixed" class="q-mr-sm" color="primary" />
          เมนู
        </q-item-label>

        <q-separator />

        <template v-for="item in filteredMenu" :key="item.name">
          <q-item
            clickable
            v-ripple
            :to="{ name: item.name }"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </template>
      </q-list>

      <div class="absolute-bottom q-pa-md text-caption text-grey">
        Smart Tracking v1.0
      </div>
    </q-drawer>

    <!-- ─── Page Content ───────────────────────────── -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/modules/auth/auth.store';

const auth = useAuthStore();
const router = useRouter();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// ─── Menu Items ───────────────────────────────────
interface MenuItem {
  name: string;
  label: string;
  icon: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    name: 'trip-control',
    label: 'เริ่มทริป',
    icon: 'play_circle',
    roles: ['Sale'],
  },
  {
    name: 'trip-history',
    label: 'ประวัติทริป',
    icon: 'history',
    roles: ['Sale', 'Manager', 'Admin'],
  },
  {
    name: 'report',
    label: 'รายงาน',
    icon: 'assessment',
    roles: ['Admin', 'Manager'],
  },
  {
    name: 'user-management',
    label: 'จัดการผู้ใช้',
    icon: 'manage_accounts',
    roles: ['Admin'],
  },
];

const filteredMenu = computed(() =>
  menuItems.filter((item) =>
    item.roles.some((r) => auth.roles.includes(r)),
  ),
);

function roleColor(role: string) {
  switch (role) {
    case 'Admin':
      return 'negative';
    case 'Manager':
      return 'warning';
    case 'Sale':
      return 'info';
    default:
      return 'grey';
  }
}

async function handleLogout() {
  await auth.logout();
  router.push({ name: 'login' });
}
</script>
