/**
 * Central RBAC permissions configuration.
 * Defines role capabilities, sidebar navigation, and page access.
 */

import {
  MdDashboard, MdInventory, MdWarehouse, MdLocalShipping,
  MdAssessment, MdHistory, MdPerson, MdAdd, MdNotifications,
  MdAssignment, MdPeople,
} from 'react-icons/md';
import { FaPlaneArrival } from 'react-icons/fa';

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  WAREHOUSE_STAFF: 'Warehouse Staff',
  OPERATIONS_STAFF: 'Operations Staff',
  DOCUMENTATION_EXEC: 'Documentation Executive',
  ACCOUNTS_STAFF: 'Accounts Staff',
};

// All available permissions
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_CARGO: 'view_cargo',
  CREATE_CARGO: 'create_cargo',
  EDIT_CARGO: 'edit_cargo',
  DELETE_CARGO: 'delete_cargo',
  VIEW_WAREHOUSE: 'view_warehouse',
  MANAGE_WAREHOUSE: 'manage_warehouse',
  VIEW_DISPATCH: 'view_dispatch',
  MANAGE_DISPATCH: 'manage_dispatch',
  VIEW_REPORTS: 'view_reports',
  VIEW_ACTIVITY_LOGS: 'view_activity_logs',
  VIEW_NOTIFICATIONS: 'view_notifications',
  VIEW_TASKS: 'view_tasks',
  CREATE_TASKS: 'create_tasks',
  MANAGE_USERS: 'manage_users',
};

// Role → permissions mapping
const rolePermissions = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions

  [ROLES.WAREHOUSE_STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.CREATE_CARGO,
    PERMISSIONS.EDIT_CARGO,
    PERMISSIONS.VIEW_WAREHOUSE,
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.VIEW_DISPATCH,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TASKS,
  ],

  [ROLES.OPERATIONS_STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.CREATE_CARGO,
    PERMISSIONS.EDIT_CARGO,
    PERMISSIONS.VIEW_DISPATCH,
    PERMISSIONS.MANAGE_DISPATCH,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TASKS,
  ],

  [ROLES.DOCUMENTATION_EXEC]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TASKS,
  ],

  [ROLES.ACCOUNTS_STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TASKS,
  ],
};

/** Check if a role has a specific permission */
export const canAccess = (role, permission) => {
  if (!role || !permission) return false;
  return (rolePermissions[role] || []).includes(permission);
};

/** Check if a role is one of the given roles */
export const hasRole = (userRole, ...roles) => roles.includes(userRole);

/** Returns true for Super Admin only */
export const isSuperAdmin = (role) => role === ROLES.SUPER_ADMIN;

// ──────────────────────────────────────────────────────────────
// Role-based sidebar navigation
// ──────────────────────────────────────────────────────────────
const ALL_NAV = {
  dashboard:   { to: '/dashboard',    icon: MdDashboard,      label: 'Dashboard' },
  cargo:       { to: '/cargo',        icon: MdInventory,      label: 'Cargo List' },
  addCargo:    { to: '/cargo/add',    icon: MdAdd,            label: 'Add Cargo' },
  warehouse:   { to: '/warehouse',    icon: MdWarehouse,      label: 'Warehouse' },
  dispatch:    { to: '/dispatch',     icon: MdLocalShipping,  label: 'Dispatch' },
  reports:     { to: '/reports',      icon: MdAssessment,     label: 'Reports' },
  activityLogs:{ to: '/activity-logs',icon: MdHistory,        label: 'Activity Logs' },
  notifications:{ to: '/notifications',icon: MdNotifications, label: 'Notifications' },
  tasks:       { to: '/tasks',        icon: MdAssignment,     label: 'My Tasks' },
  users:       { to: '/users',        icon: MdPeople,         label: 'User Management' },
  profile:     { to: '/profile',      icon: MdPerson,         label: 'Profile' },
};

const roleNavConfig = {
  [ROLES.SUPER_ADMIN]: [
    ALL_NAV.dashboard, ALL_NAV.cargo, ALL_NAV.addCargo,
    ALL_NAV.warehouse, ALL_NAV.dispatch, ALL_NAV.reports,
    ALL_NAV.activityLogs, ALL_NAV.tasks, ALL_NAV.users,
    ALL_NAV.notifications, ALL_NAV.profile,
  ],
  [ROLES.WAREHOUSE_STAFF]: [
    ALL_NAV.dashboard, ALL_NAV.cargo, ALL_NAV.addCargo,
    ALL_NAV.warehouse, ALL_NAV.dispatch,
    ALL_NAV.tasks, ALL_NAV.notifications, ALL_NAV.profile,
  ],
  [ROLES.OPERATIONS_STAFF]: [
    ALL_NAV.dashboard, ALL_NAV.cargo, ALL_NAV.addCargo,
    ALL_NAV.dispatch, ALL_NAV.reports,
    ALL_NAV.tasks, ALL_NAV.notifications, ALL_NAV.profile,
  ],
  [ROLES.DOCUMENTATION_EXEC]: [
    ALL_NAV.dashboard, ALL_NAV.cargo,
    ALL_NAV.reports,
    ALL_NAV.tasks, ALL_NAV.notifications, ALL_NAV.profile,
  ],
  [ROLES.ACCOUNTS_STAFF]: [
    ALL_NAV.dashboard, ALL_NAV.cargo,
    ALL_NAV.reports,
    ALL_NAV.tasks, ALL_NAV.notifications, ALL_NAV.profile,
  ],
};

/** Get sidebar nav items for a given role */
export const getRoleNav = (role) => roleNavConfig[role] || roleNavConfig[ROLES.WAREHOUSE_STAFF];

// Role badge colors for UI display
export const roleBadgeColors = {
  [ROLES.SUPER_ADMIN]:        { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  [ROLES.WAREHOUSE_STAFF]:    { bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-500' },
  [ROLES.OPERATIONS_STAFF]:   { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  [ROLES.DOCUMENTATION_EXEC]: { bg: 'bg-purple-100',text: 'text-purple-700',dot: 'bg-purple-500' },
  [ROLES.ACCOUNTS_STAFF]:     { bg: 'bg-rose-100',  text: 'text-rose-700',  dot: 'bg-rose-500' },
};

// Demo credentials for Login page
export const DEMO_USERS = [
  { role: ROLES.SUPER_ADMIN,        email: 'admin@cargowarehouse.com',    password: 'Password@123', name: 'Super Admin' },
  { role: ROLES.WAREHOUSE_STAFF,    email: 'warehouse@cargowarehouse.com',password: 'Password@123', name: 'Ahmed Al-Rashidi' },
  { role: ROLES.OPERATIONS_STAFF,   email: 'ops@cargowarehouse.com',      password: 'Password@123', name: 'Fatima Al-Zahra' },
  { role: ROLES.DOCUMENTATION_EXEC, email: 'docs@cargowarehouse.com',     password: 'Password@123', name: 'Hassan Mohammed' },
  { role: ROLES.ACCOUNTS_STAFF,     email: 'accounts@cargowarehouse.com', password: 'Password@123', name: 'Mariam Khalid' },
];
