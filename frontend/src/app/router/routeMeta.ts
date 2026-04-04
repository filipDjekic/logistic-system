export type AppRouteMeta = {
  path: string;
  title: string;
  breadcrumb: string;
};

export const routeMeta = {
  starter: {
    path: '/',
    title: 'Welcome',
    breadcrumb: 'Welcome',
  },
  login: {
    path: '/login',
    title: 'Login',
    breadcrumb: 'Login',
  },
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    breadcrumb: 'Dashboard',
  },
  notifications: {
    path: '/notifications',
    title: 'Notifications',
    breadcrumb: 'Notifications',
  },
} satisfies Record<string, AppRouteMeta>;

export function getRouteMetaByPath(pathname: string): AppRouteMeta | null {
  const entries = Object.values(routeMeta);
  return entries.find((item) => item.path === pathname) ?? null;
}