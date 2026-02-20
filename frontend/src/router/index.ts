import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/modules/auth/auth.store';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // ─── Navigation Guards ──────────────────────────────
  Router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore();

    // Guest-only route (login)
    if (to.meta.guest && auth.isAuthenticated) {
      return next({ name: 'trip-control' });
    }

    // Protected route
    if (to.meta.requiresAuth || to.matched.some((r) => r.meta.requiresAuth)) {
      if (!auth.isAuthenticated) {
        return next({ name: 'login', query: { redirect: to.fullPath } });
      }

      // Fetch profile if not loaded yet
      if (!auth.user) {
        try {
          await auth.fetchProfile();
        } catch {
          auth.logout();
          return next({ name: 'login' });
        }
      }

      // Role check
      const requiredRoles = to.meta.roles as string[] | undefined;
      if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = auth.roles;
        const hasRole = requiredRoles.some((r) => userRoles.includes(r));
        if (!hasRole) {
          // Redirect based on user role
          if (auth.isSale) return next({ name: 'trip-control' });
          if (auth.isAdmin || auth.isManager) return next({ name: 'report' });
          return next({ name: 'login' });
        }
      }
    }

    next();
  });

  return Router;
});
