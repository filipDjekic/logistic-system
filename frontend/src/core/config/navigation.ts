import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import { ALL_ROLES, type Role } from '../constants/roles';

export type NavigationItem = {
  key: string;
  label: string;
  to: string;
  roles: readonly Role[];
  icon: SvgIconComponent;
};

export const navigationItems: NavigationItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    roles: ALL_ROLES,
    icon: DashboardRoundedIcon,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    to: '/notifications',
    roles: ALL_ROLES,
    icon: NotificationsRoundedIcon,
  },
];