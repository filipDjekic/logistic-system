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
import PlaylistAddCheckRoundedIcon from '@mui/icons-material/PlaylistAddCheckRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import { ALL_ROLES, ROLES, type Role } from '../constants/roles';

export type NavigationItem = {
  key: string;
  label: string;
  to: string;
  roles: readonly Role[];
  icon: SvgIconComponent;
};

export type NavigationSection = {
  key: string;
  label: string;
  items: NavigationItem[];
};

type NavigationSectionTemplate = {
  key: string;
  label: string;
  itemKeys: string[];
};

const navigationItemsByKey: Record<string, NavigationItem> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', to: '/dashboard', roles: ALL_ROLES, icon: DashboardRoundedIcon },
  notifications: { key: 'notifications', label: 'Notifications', to: '/notifications', roles: ALL_ROLES, icon: NotificationsRoundedIcon },
  profile: { key: 'profile', label: 'My Profile', to: '/profile', roles: ALL_ROLES, icon: AccountCircleRoundedIcon },
  'my-shifts': { key: 'my-shifts', label: 'My Shifts', to: '/my-shifts', roles: ALL_ROLES, icon: EventNoteRoundedIcon },

  companies: { key: 'companies', label: 'Companies', to: '/companies', roles: [ROLES.OVERLORD], icon: BusinessRoundedIcon },
  'company-registration-requests': { key: 'company-registration-requests', label: 'Registration Requests', to: '/company-registration-requests', roles: [ROLES.OVERLORD], icon: BusinessRoundedIcon },
  employees: { key: 'employees', label: 'Employees', to: '/employees', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER], icon: GroupsRoundedIcon },
    shifts: { key: 'shifts', label: 'Shifts', to: '/shifts', roles: [ROLES.OVERLORD, ROLES.HR_MANAGER, ROLES.DISPATCHER], icon: ScheduleRoundedIcon },
  users: { key: 'users', label: 'Users', to: '/users', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER], icon: ManageAccountsRoundedIcon },
  'employee-profile-change-requests': { key: 'employee-profile-change-requests', label: 'Profile Requests', to: '/employee-profile-change-requests', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER], icon: FactCheckRoundedIcon },
  roles: { key: 'roles', label: 'Roles', to: '/roles', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER], icon: AdminPanelSettingsRoundedIcon },

  'transport-orders': { key: 'transport-orders', label: 'Transport Orders', to: '/transport-orders', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER, ROLES.WORKER], icon: LocalShippingRoundedIcon },
  tasks: { key: 'tasks', label: 'Tasks', to: '/tasks', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER, ROLES.WORKER], icon: AssignmentRoundedIcon },
  vehicles: { key: 'vehicles', label: 'Vehicles', to: '/vehicles', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER], icon: DirectionsCarFilledRoundedIcon },

  warehouses: { key: 'warehouses', label: 'Warehouses', to: '/warehouses', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.WORKER], icon: WarehouseRoundedIcon },
  products: { key: 'products', label: 'Products', to: '/products', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER], icon: CategoryRoundedIcon },
  inventory: { key: 'inventory', label: 'Inventory', to: '/inventory', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER], icon: Inventory2RoundedIcon },
  'stock-movements': { key: 'stock-movements', label: 'Stock Movements', to: '/stock-movements', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.WORKER], icon: SyncAltRoundedIcon },
  'inventory-counts': { key: 'inventory-counts', label: 'Inventory Counts', to: '/inventory-counts', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.WORKER], icon: PlaylistAddCheckRoundedIcon },

  'transport-report': { key: 'transport-report', label: 'Transport Report', to: '/reports/transport', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER], icon: AssessmentRoundedIcon },
  'inventory-report': { key: 'inventory-report', label: 'Inventory Report', to: '/reports/inventory', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER], icon: AssessmentRoundedIcon },
  'employee-task-report': { key: 'employee-task-report', label: 'Employee / Task Report', to: '/reports/employee-tasks', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER], icon: AssessmentRoundedIcon },

  'activity-logs': { key: 'activity-logs', label: 'Activity Logs', to: '/activity-logs', roles: [ROLES.OVERLORD], icon: HistoryRoundedIcon },
  'activity-timeline': { key: 'activity-timeline', label: 'Activity Timeline', to: '/activity-timeline', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER], icon: HistoryRoundedIcon },
  'change-history': { key: 'change-history', label: 'Change History', to: '/change-history', roles: [ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER], icon: FactCheckRoundedIcon },
};

const defaultNavigationTemplate: NavigationSectionTemplate[] = [
  { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
  { key: 'transport', label: 'Transport', itemKeys: ['transport-orders', 'tasks', 'vehicles'] },
  { key: 'warehouse', label: 'Warehouse', itemKeys: ['warehouses', 'products', 'inventory', 'stock-movements', 'inventory-counts'] },
  { key: 'workforce', label: 'Workforce', itemKeys: ['companies', 'company-registration-requests', 'employees', 'employee-profile-change-requests', 'shifts', 'users', 'roles'] },
  { key: 'data-reports', label: 'Data & Reports', itemKeys: ['transport-report', 'inventory-report', 'employee-task-report'] },
  { key: 'audit', label: 'Audit', itemKeys: ['activity-timeline', 'change-history', 'activity-logs'] },
  { key: 'personal', label: 'Personal', itemKeys: ['profile', 'my-shifts'] },
];

const navigationTemplatesByRole: Partial<Record<Role, NavigationSectionTemplate[]>> = {
  [ROLES.OVERLORD]: defaultNavigationTemplate,
  [ROLES.COMPANY_ADMIN]: [
    { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
    { key: 'transport', label: 'Transport', itemKeys: ['transport-orders', 'tasks', 'vehicles'] },
    { key: 'warehouse', label: 'Warehouse', itemKeys: ['warehouses', 'products', 'inventory', 'stock-movements', 'inventory-counts'] },
    { key: 'workforce', label: 'Workforce', itemKeys: ['employees', 'employee-profile-change-requests', 'users'] },
    { key: 'data-reports', label: 'Data & Reports', itemKeys: ['transport-report', 'inventory-report', 'employee-task-report'] },
    { key: 'audit', label: 'Audit', itemKeys: ['activity-timeline', 'change-history'] },
    { key: 'personal', label: 'Personal', itemKeys: ['profile', 'my-shifts'] },
  ],
  [ROLES.HR_MANAGER]: [
    { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
    { key: 'workforce', label: 'Workforce', itemKeys: ['employees', 'employee-profile-change-requests', 'shifts'] },
    { key: 'data-reports', label: 'Data & Reports', itemKeys: ['employee-task-report'] },
    { key: 'personal', label: 'Personal', itemKeys: ['profile', 'my-shifts'] },
  ],
  [ROLES.WAREHOUSE_MANAGER]: [
    { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
    { key: 'warehouse', label: 'Warehouse', itemKeys: ['warehouses', 'inventory', 'products', 'stock-movements', 'inventory-counts'] },
    { key: 'transport', label: 'Transport', itemKeys: ['tasks', 'transport-orders', 'vehicles'] },
    { key: 'workforce', label: 'Workforce', itemKeys: ['employees'] },
    { key: 'data-reports', label: 'Data & Reports', itemKeys: ['inventory-report', 'transport-report'] },
    { key: 'audit', label: 'Audit', itemKeys: ['activity-timeline', 'change-history'] },
    { key: 'personal', label: 'Personal', itemKeys: ['profile', 'my-shifts'] },
  ],
  [ROLES.DISPATCHER]: [
    { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
    { key: 'transport', label: 'Transport', itemKeys: ['transport-orders', 'tasks', 'vehicles'] },
    { key: 'warehouse-reference', label: 'Warehouse Reference', itemKeys: ['warehouses', 'products', 'inventory', 'stock-movements', 'inventory-counts'] },
    { key: 'workforce-reference', label: 'Workforce Reference', itemKeys: ['employees', 'shifts'] },
    { key: 'data-reports', label: 'Data & Reports', itemKeys: ['transport-report'] },
    { key: 'audit', label: 'Audit', itemKeys: ['activity-timeline', 'change-history'] },
    { key: 'personal', label: 'Personal', itemKeys: ['profile', 'my-shifts'] },
  ],
  [ROLES.DRIVER]: [
    { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
    { key: 'my-work', label: 'My Work', itemKeys: ['profile', 'transport-orders', 'tasks', 'vehicles', 'my-shifts'] },
  ],
  [ROLES.WORKER]: [
    { key: 'command-center', label: 'Command Center', itemKeys: ['dashboard', 'notifications'] },
    { key: 'my-work', label: 'My Work', itemKeys: ['profile', 'tasks', 'transport-orders', 'stock-movements', 'inventory-counts', 'my-shifts'] },
    { key: 'warehouse-reference', label: 'Warehouse Reference', itemKeys: ['warehouses'] },
  ],
};

function buildNavigationSections(template: NavigationSectionTemplate[]) {
  return template
    .map((section) => ({
      key: section.key,
      label: section.label,
      items: section.itemKeys.map((itemKey) => navigationItemsByKey[itemKey]).filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);
}

export const navigationSections: NavigationSection[] = buildNavigationSections(defaultNavigationTemplate);

export const navigationItems: NavigationItem[] = Object.values(navigationItemsByKey);

export function getNavigationSectionsForRole(role: Role | null | undefined): NavigationSection[] {
  if (!role) {
    return [];
  }

  return buildNavigationSections(navigationTemplatesByRole[role] ?? defaultNavigationTemplate);
}
