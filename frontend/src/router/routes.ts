import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // ─── Auth (No Layout) ──────────────────────────────────
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('src/modules/auth/pages/LoginPage.vue'),
        meta: { guest: true },
      },
    ],
  },

  // ─── Main App (Authenticated) ─────────────────────────
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Default redirect
      {
        path: '',
        redirect: '/trip-control',
      },

      // ─── Sale Pages ──────────────────────────────────
      {
        path: 'trip-control',
        name: 'trip-control',
        component: () => import('src/modules/trip/pages/TripControlPage.vue'),
        meta: { roles: ['Sale'] },
      },
      {
        path: 'trip-history',
        name: 'trip-history',
        component: () => import('src/modules/trip/pages/TripHistoryPage.vue'),
        meta: { roles: ['Sale', 'Manager', 'Admin'] },
      },
      {
        path: 'trip/:id',
        name: 'trip-detail',
        component: () => import('src/modules/trip/pages/TripDetailPage.vue'),
        meta: { roles: ['Sale', 'Manager', 'Admin'] },
        props: true,
      },

      // ─── Admin / Manager Pages ───────────────────────
      {
        path: 'report',
        name: 'report',
        component: () => import('src/modules/report/pages/ReportPage.vue'),
        meta: { roles: ['Admin', 'Manager'] },
      },
      {
        path: 'user-management',
        name: 'user-management',
        component: () => import('src/modules/user/pages/UserManagementPage.vue'),
        meta: { roles: ['Admin'] },
      },
    ],
  },

  // ─── 404 Catch-all ────────────────────────────────────
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/ErrorNotFound.vue'),
  },
];

export default routes;
