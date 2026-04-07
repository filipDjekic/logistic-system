import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import type { SvgIconComponent } from '@mui/icons-material';
import { ALL_ROLES, ROLES, type Role } from '../constants/roles';

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
  {
    key: 'my-shifts',
    label: 'My Shifts',
    to: '/my-shifts',
    roles: ALL_ROLES,
    icon: EventNoteRoundedIcon,
  },
  {
    key: 'shifts',
    label: 'Shifts',
    to: '/shifts',
    roles: ALL_ROLES,
    icon: ScheduleRoundedIcon,
  },
  {
    key: 'transport-orders',
    label: 'Transport Orders',
    to: '/transport-orders',
    roles: ALL_ROLES,
    icon: LocalShippingRoundedIcon,
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    to: '/vehicles',
    roles: ALL_ROLES,
    icon: DirectionsCarFilledRoundedIcon,
  },
  {
    key: 'inventory',
    label: 'Inventory',
    to: '/inventory',
    roles: [ROLES.ADMIN],
    icon: Inventory2RoundedIcon,
  },
];