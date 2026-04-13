import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
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
    key: 'companies',
    label: 'Companies',
    to: '/companies',
    roles: [ROLES.OVERLORD],
    icon: BusinessRoundedIcon,
  },
  {
    key: 'shifts',
    label: 'Shifts',
    to: '/shifts',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER],
    icon: ScheduleRoundedIcon,
  },
  {
    key: 'transport-orders',
    label: 'Transport Orders',
    to: '/transport-orders',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.DRIVER],
    icon: LocalShippingRoundedIcon,
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    to: '/vehicles',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER],
    icon: DirectionsCarFilledRoundedIcon,
  },
  {
    key: 'warehouses',
    label: 'Warehouses',
    to: '/warehouses',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER],
    icon: WarehouseRoundedIcon,
  },
  {
    key: 'products',
    label: 'Products',
    to: '/products',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER],
    icon: CategoryRoundedIcon,
  },
  {
    key: 'inventory',
    label: 'Inventory',
    to: '/inventory',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER],
    icon: Inventory2RoundedIcon,
  },
  {
    key: 'stock-movements',
    label: 'Stock Movements',
    to: '/stock-movements',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER],
    icon: SyncAltRoundedIcon,
  },
  {
    key: 'employees',
    label: 'Employees',
    to: '/employees',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER],
    icon: GroupsRoundedIcon,
  },
  {
    key: 'tasks',
    label: 'Tasks',
    to: '/tasks',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER, ROLES.WORKER],
    icon: AssignmentRoundedIcon,
  },
  {
    key: 'users',
    label: 'Users',
    to: '/users',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN],
    icon: GroupsRoundedIcon,
  },
  {
    key: 'roles',
    label: 'Roles',
    to: '/roles',
    roles: [ROLES.OVERLORD],
    icon: AdminPanelSettingsRoundedIcon,
  },
  {
    key: 'activity-logs',
    label: 'Activity Logs',
    to: '/activity-logs',
    roles: [ROLES.OVERLORD],
    icon: HistoryRoundedIcon,
  },
  {
    key: 'change-history',
    label: 'Change History',
    to: '/change-history',
    roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.DRIVER, ROLES.WORKER],
    icon: FactCheckRoundedIcon,
  },
];