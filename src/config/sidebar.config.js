
import { FiHome, FiCheckSquare, FiUsers, FiTag, FiBriefcase, FiLock } from 'react-icons/fi';
import { ROUTES } from './routes.config';

export const SIDEBAR_ITEMS = [
    {
        label: 'Dashboard',
        icon: FiHome,
        to: ROUTES.DASHBOARD,
        permission: null, // Visible to everyone
    },
    {
        label: 'Tasks',
        icon: FiCheckSquare,
        to: ROUTES.TASKS,
        permission: 'tasks-read',
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
        label: 'Permissions',
        icon: FiLock,
        to: ROUTES.PERMISSIONS,
        permission: 'permissions-read',
    },
];
