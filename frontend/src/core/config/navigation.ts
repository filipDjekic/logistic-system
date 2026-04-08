import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
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
    roles: ALL_ROLES,
    icon: Inventory2RoundedIcon,
  },
  {
    key: 'stock-movements',
    label: 'Stock Movements',
    to: '/stock-movements',
    roles: ALL_ROLES,
    icon: SyncAltRoundedIcon,
  },
  {
    key: 'employees',
    label: 'Employees',
    to: '/employees',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
    icon: GroupsRoundedIcon,
  },
];