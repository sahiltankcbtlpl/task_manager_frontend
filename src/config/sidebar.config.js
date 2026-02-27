
import { FiHome, FiCheckSquare, FiUsers, FiTag, FiBriefcase, FiLock, FiFolder, FiAlertCircle } from 'react-icons/fi';
import { ROUTES } from './routes.config';

export const SIDEBAR_ITEMS = [
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
        permission: null, // Depending on if it needs permission, assuming everyone can see their team or we handle it inside
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
