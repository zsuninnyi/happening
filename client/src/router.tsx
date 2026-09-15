import { createRootRoute, createRoute, createRouter, Navigate } from '@tanstack/react-router';
import { RequireAuth, RootLayout } from './layouts/RootLayout';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminHistoryPage } from './pages/admin/AdminHistoryPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/login" />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const userLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'user',
  component: () => <RequireAuth role="user" />,
});

const alertsRoute = createRoute({
  getParentRoute: () => userLayoutRoute,
  path: '/alerts',
  component: AlertsPage,
});

const historyRoute = createRoute({
  getParentRoute: () => userLayoutRoute,
  path: '/history',
  component: HistoryPage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: () => <RequireAuth role="admin" />,
});

const adminEventsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/events',
  component: AdminEventsPage,
});

const adminAlertsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/alerts',
  component: AdminAlertsPage,
});

const adminHistoryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/history',
  component: AdminHistoryPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/users',
  component: AdminUsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  userLayoutRoute.addChildren([alertsRoute, historyRoute]),
  adminLayoutRoute.addChildren([
    adminEventsRoute,
    adminAlertsRoute,
    adminHistoryRoute,
    adminUsersRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: false,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
