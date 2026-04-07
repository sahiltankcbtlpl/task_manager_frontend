import { FiHome, FiCheckSquare, FiUsers, FiTag, FiBriefcase, FiLock, FiFolder, FiAlertCircle, FiFileText, FiPackage } from 'react-icons/fi';
import { ROUTES } from './routes.config';

export const SIDEBAR_ITEMS = [
    // ... items preserved
    {
        label: 'Dashboard',
        icon: FiHome,
        to: ROUTES.DASHBOARD,
        permission: null, // Visible to everyone
    },
    {
        label: 'Team',
        icon: FiUsers,
        to: ROUTES.TEAM,
        permission: 'team-read',
    },
    {
        label: 'Projects',
        icon: FiFolder,
        to: ROUTES.PROJECTS,
        permission: 'projects-read',
    },
    {
        label: 'Tasks',
        icon: FiCheckSquare,
        to: ROUTES.TASKS,
        permission: 'tasks-read',
    },
    {
        label: 'Issues',
        icon: FiAlertCircle,
        to: ROUTES.ISSUES,
        permission: 'tasks-read', // Shares permission with tasks per plan
    },
    {
        label: 'Documents',
        icon: FiFileText,
        to: ROUTES.DOCUMENTS,
        permission: null, // Tied to project access
    },
    {
        label: 'Users',
        icon: FiUsers,
        to: ROUTES.STAFF,
        permission: 'users-read',
    },
    {
        label: 'Task Status',
        icon: FiTag,
        to: ROUTES.TASK_STATUS,
        permission: 'task_status-read',
    },
    {
        label: 'Roles',
        icon: FiBriefcase,
        to: ROUTES.ROLES,
        permission: 'roles-read',
    },
    {
        label: 'Company Settings',
        icon: FiBriefcase,
        to: ROUTES.COMPANY_SETTINGS,
        ownerOnly: true, // Specifically limited to Company Owner
    },
    {
        label: 'My Subscription',
        icon: FiPackage,
        to: '/settings/subscription',
        ownerOnly: true,
    },
    {
        label: 'Permissions',
        icon: FiLock,
        to: ROUTES.PERMISSIONS,
        permission: 'superadmin-only', // Only Super Admin should see this
    },
    {
        label: 'Subscriptions',
        icon: FiBriefcase,
        to: ROUTES.SUBSCRIPTIONS,
        superAdminOnly: true,
    },
];
