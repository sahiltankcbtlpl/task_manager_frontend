import { Box, Heading, Flex, Badge, Button, IconButton, useToast, HStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getTasks, deleteTask, updateTask } from '../../api/task.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiCheckSquare } from 'react-icons/fi';
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
import { getTaskStatuses } from '../../api/taskStatus.api';
import { getStaffList } from '../../api/user.api';
import { ROLES } from '../../constants/roles';
import TaskDetailsModal from '../../components/tasks/TaskDetailsModal';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { user: currentUser } = useAuth();

    const [statusOptions, setStatusOptions] = useState([]);
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');

    // Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            // Only fetch staff if not a Staff user (presumed they don't have permission/need)
            const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;

            // Pass filters to getTasks
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (assigneeFilter) params.assignee = assigneeFilter;

            const promises = [getTasks(params), getTaskStatuses()];
            if (!isStaff) {
                promises.push(getStaffList());
            }

            const results = await Promise.all(promises);
            const tasksData = results[0];
            const statusesData = results[1];
            const staffData = isStaff ? [] : results[2];

            setTasks(tasksData);
            setStatusOptions(statusesData
                .map(s => ({ label: s.name, value: s._id }))
            );
            if (!isStaff && staffData) {
                setAssigneeOptions(staffData.map(u => ({ label: u.name, value: u._id })));
            }
        } catch (error) {
            toast({
                title: 'Error fetching data',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, assigneeFilter]);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Search and Filter logic
    const filteredTasks = tasks.filter(task => {
        // Only search logic remains on client-side as requested
        const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assignee?.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    // Pagination logic
    const totalItems = filteredTasks.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
            await updateTask(id, { [field]: value });
            // Optimistic update
            setTasks(prev => prev.map(t => {
                if (t._id === id) {
                    if (field === 'taskStatus') {
                        const newStatus = statusOptions.find(o => o.value === value);
                        return { ...t, taskStatus: { _id: value, name: newStatus?.label, status: 'active' } }; // Simplified mock
                    }
                    if (field === 'assignee') {
                        const newAssignee = assigneeOptions.find(o => o.value === value);
                        return { ...t, assignee: { _id: value, name: newAssignee?.label } };
                    }
                }
                return t;
            }));
            toast({ title: 'Task updated', status: 'success' });
            fetchTasks(); // Refresh to get full data (e.g. populated fields if structure changes significantly)
        } catch (error) {
            toast({
                title: 'Update failed',
                description: error.response?.data?.message || 'Could not update task',
                status: 'error'
            });
        }
    };

    if (loading) return <Loader />;

    const canUpdate = hasPermission(currentUser, 'tasks-update');

    const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;

    const columns = [
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
        columns.push({
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
        columns.push({
            header: 'Actions',
            render: (task) => (
                <TableActions
                    onEdit={`${ROUTES.TASKS}/edit/${task._id}`}
                    onDelete={() => handleDelete(task._id)}
                    editPermission="tasks-update"
                    deletePermission="tasks-delete"
                    item={task}
                />
            )
        });
    }

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Tasks</Heading>
                <CanAccess permission="tasks-create">
                    <Link to={ROUTES.CREATE_TASK}>
                        <Button leftIcon={<FiPlus />} colorScheme="brand">Create Task</Button>
                    </Link>
                </CanAccess>
            </Flex>

            <Flex mb={4} gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                    <SearchBar
                        placeholder="Search tasks..."
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

            {tasks.length === 0 ? (
                <EmptyState title="No Tasks" description="Create a task to get started" icon={FiCheckSquare} />
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
