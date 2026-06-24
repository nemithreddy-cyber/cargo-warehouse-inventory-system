/**
 * Central RBAC permissions configuration.
 * Defines role capabilities, sidebar navigation, and page access.
 */

import {
  MdDashboard, MdInventory, MdWarehouse, MdLocalShipping,
  MdAssessment, MdAdd, MdSmartToy, MdMessage
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
  VIEW_AI_OPERATIONS: 'view_ai_operations',
  VIEW_MESSAGES_LOG: 'view_messages_log',
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
    PERMISSIONS.VIEW_AI_OPERATIONS,
    PERMISSIONS.VIEW_MESSAGES_LOG,
  ],

  [ROLES.OPERATIONS_STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.CREATE_CARGO,
    PERMISSIONS.EDIT_CARGO,
    PERMISSIONS.VIEW_DISPATCH,
    PERMISSIONS.MANAGE_DISPATCH,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_AI_OPERATIONS,
    PERMISSIONS.VIEW_MESSAGES_LOG,
  ],

  [ROLES.DOCUMENTATION_EXEC]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_AI_OPERATIONS,
    PERMISSIONS.VIEW_MESSAGES_LOG,
  ],

  [ROLES.ACCOUNTS_STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CARGO,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_AI_OPERATIONS,
    PERMISSIONS.VIEW_MESSAGES_LOG,
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
  dashboard:    { to: '/dashboard',    icon: MdDashboard,      label: 'Dashboard',        group: 'core' },
  cargo:        { to: '/cargo',        icon: MdInventory,      label: 'Cargo Inventory',  group: 'core' },
  addCargo:     { to: '/cargo/add',    icon: MdAdd,            label: 'Receive Cargo',    group: 'core' },
  warehouse:    { to: '/warehouse',    icon: MdWarehouse,      label: 'Warehouse',        group: 'core' },
  dispatch:     { to: '/dispatch',     icon: MdLocalShipping,  label: 'Dispatch',         group: 'core' },
  reports:      { to: '/reports',      icon: MdAssessment,     label: 'Reports',          group: 'core' },
  aiOperations: { to: '/ai-operations',icon: MdSmartToy,       label: 'AI Operations',    group: 'core' },
  messaging:    { to: '/messaging',     icon: MdMessage,        label: 'Messaging Center', group: 'core' },
};

const roleNavConfig = {
  [ROLES.SUPER_ADMIN]: [
    ALL_NAV.dashboard, ALL_NAV.cargo, ALL_NAV.addCargo,
    ALL_NAV.warehouse, ALL_NAV.dispatch, ALL_NAV.reports,
    ALL_NAV.aiOperations, ALL_NAV.messaging,
  ],
  [ROLES.WAREHOUSE_STAFF]: [
    ALL_NAV.dashboard, ALL_NAV.cargo, ALL_NAV.addCargo,
    ALL_NAV.warehouse, ALL_NAV.dispatch,
    ALL_NAV.aiOperations, ALL_NAV.messaging,
  ],
  [ROLES.OPERATIONS_STAFF]: [
    ALL_NAV.dashboard, ALL_NAV.cargo, ALL_NAV.addCargo,
    ALL_NAV.dispatch, ALL_NAV.reports,
    ALL_NAV.aiOperations, ALL_NAV.messaging,
  ],
  [ROLES.DOCUMENTATION_EXEC]: [
    ALL_NAV.dashboard, ALL_NAV.cargo,
    ALL_NAV.reports,
    ALL_NAV.aiOperations, ALL_NAV.messaging,
  ],
  [ROLES.ACCOUNTS_STAFF]: [
    ALL_NAV.dashboard, ALL_NAV.cargo,
    ALL_NAV.reports,
    ALL_NAV.aiOperations, ALL_NAV.messaging,
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
