import { Box, Heading, Flex, Badge, Button, IconButton, useToast, HStack } from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { getTasks, deleteTask, updateTask } from '../../api/task.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config'; // Need to add TASK routes
import CanAccess from '../../components/common/CanAccess';
import TableActions from '../../components/common/TableActions';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import TableFilter from '../../components/common/TableFilter';
import TableSelect from '../../components/common/TableSelect';
import { hasPermission } from '../../utils/permissions';
import useAuth from '../../hooks/useAuth';
import { useProject } from '../../context/ProjectContext';
import { getTaskStatuses } from '../../api/taskStatus.api';
import { getStaffList } from '../../api/user.api';
import { ROLES } from '../../constants/roles';
import TaskDetailsModal from '../../components/tasks/TaskDetailsModal';
import useDebounce from '../../hooks/useDebounce';

const TaskList = ({ category = 'TASK' }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { user: currentUser } = useAuth();
    const { activeProjectId } = useProject();

    const [statusOptions, setStatusOptions] = useState([]);
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const fetchOptions = async () => {
        try {
            const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;
            const promises = [getTaskStatuses()];
            if (!isStaff) {
                promises.push(getStaffList());
            }

            const results = await Promise.all(promises);
            const statusesData = results[0];
            const staffData = isStaff ? [] : results[1];

            setStatusOptions(statusesData.map(s => ({ label: s.name, value: s._id })));
            if (!isStaff && staffData) {
                const filteredStaff = staffData.filter(u => {
                    const roleName = u.role?.name || u.role;
                    return roleName !== ROLES.ADMIN;
                });
                setAssigneeOptions(filteredStaff.map(u => ({ label: u.name, value: u._id })));
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = { category };
            if (activeProjectId) params.project = activeProjectId;
            if (statusFilter) params.status = statusFilter;
            if (assigneeFilter) params.assignee = assigneeFilter;
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const tasksData = await getTasks(params);
            setTasks(tasksData);
        } catch (error) {
            toast({
                title: 'Error fetching tasks',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset page on search or project change
    useEffect(() => {
        setCurrentPage(1);
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, assigneeFilter, debouncedSearchTerm, activeProjectId, category]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Pagination logic (now based on all tasks from backend)
    const totalItems = tasks.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedTasks = tasks.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await deleteTask(id);
            toast({ title: 'Task deleted', status: 'success' });
            fetchTasks();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', status: 'error' });
        }
    };

    const handleUpdateTask = async (id, field, value) => {
        try {
            const updatedTaskData = await updateTask(id, { [field]: value });

            // Update local state with the returned populated task
            setTasks(prev => prev.map(t => (t._id === id ? updatedTaskData : t)));

            toast({ title: 'Task updated', status: 'success' });
        } catch (error) {
            toast({
                title: 'Update failed',
                description: error.response?.data?.message || 'Could not update task',
                status: 'error'
            });
        }
    };

    const canUpdate = hasPermission(currentUser, 'tasks-update');
    const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;

    const columns = useMemo(() => {
        const cols = [
            {
                header: 'Title',
                accessor: 'name',
                render: (task) => (
                    <Box
                        fontWeight="medium"
                        cursor="pointer"
                        color="brand.600"
                        _hover={{ textDecoration: 'underline' }}
                        onClick={() => handleViewTask(task)}
                    >
                        {task.name}
                    </Box>
                )
            },
            {
                header: 'Status',
                accessor: 'taskStatus',
                render: (task) => (
                    <TableSelect
                        value={task.taskStatus?._id || ''}
                        options={statusOptions}
                        onChange={(val) => handleUpdateTask(task._id, 'taskStatus', val)}
                        isDisabled={!canUpdate}
                        placeholder="Select Status"
                    />
                )
            }
        ];

        if (!isStaff) {
            cols.push({
                header: 'Assignee',
                accessor: 'assignee',
                render: (task) => (
                    <TableSelect
                        value={task.assignee?._id || ''}
                        options={assigneeOptions}
                        onChange={(val) => handleUpdateTask(task._id, 'assignee', val)}
                        isDisabled={!canUpdate || assigneeOptions.length === 0}
                        placeholder="Unassigned"
                    />
                )
            });
        }

        if (hasPermission(currentUser, 'tasks-update') || hasPermission(currentUser, 'tasks-delete')) {
            cols.push({
                header: 'Actions',
                render: (task) => (
                    <TableActions
                        onEdit={`${editRouteBase}/edit/${task._id}`}
                        onDelete={() => handleDelete(task._id)}
                        editPermission="tasks-update"
                        deletePermission="tasks-delete"
                        item={task}
                    />
                )
            });
        }

        return cols;
    }, [statusOptions, assigneeOptions, canUpdate, isStaff, currentUser]);


    // Dynamic text based on category
    const isIssue = category === 'ISSUE';
    const createRoute = isIssue ? ROUTES.CREATE_ISSUE : ROUTES.CREATE_TASK;
    const editRouteBase = isIssue ? ROUTES.ISSUES : ROUTES.TASKS;
    const titleText = isIssue ? 'Issues' : 'Tasks';
    const createText = isIssue ? 'Create Issue' : 'Create Task';
    const itemName = isIssue ? 'issue' : 'task';

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">{titleText}</Heading>
                <CanAccess permission="tasks-create">
                    <Link to={createRoute}>
                        <Button leftIcon={<FiPlus />} colorScheme="brand">{createText}</Button>
                    </Link>
                </CanAccess>
            </Flex>

            <Flex mb={4} gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                    <SearchBar
                        placeholder={`Search ${itemName}s...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
                <TableFilter
                    placeholder="Filter by Status"
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                />
                {(currentUser?.role?.name !== ROLES.STAFF && currentUser?.role !== ROLES.STAFF) && (
                    <TableFilter
                        placeholder="Filter by Assignee"
                        options={assigneeOptions}
                        value={assigneeFilter}
                        onChange={setAssigneeFilter}
                    />
                )}
            </Flex>

            {loading ? (
                <DataTable
                    columns={columns}
                    data={[]}
                    isLoading={true}
                />
            ) : tasks.length === 0 ? (
                <EmptyState title={`No ${titleText}`} description={`Create a ${itemName} to get started`} icon={isIssue ? FiAlertCircle : FiCheckSquare} />
            ) : (
                <DataTable
                    columns={columns}
                    data={paginatedTasks}
                    isLoading={loading}
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                        pageSize,
                        onPageSizeChange: setPageSize,
                        totalItems
                    }}
                />
            )}

            <TaskDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
            />
        </Box>
    );
};

export default TaskList;
