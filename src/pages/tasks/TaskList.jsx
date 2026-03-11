import { Box, Heading, Flex, Badge, Button, IconButton, useToast, HStack } from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { getTasks, deleteTask, updateTask } from '../../api/task.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiCheckSquare, FiAlertCircle, FiUpload } from 'react-icons/fi';
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
import { getProjectMembers } from '../../api/project.api';
import { getStaffList } from '../../api/user.api';
import { ROLES } from '../../constants/roles';
import TaskDetailsModal from '../../components/tasks/TaskDetailsModal';
import BulkUploadModal from '../../components/tasks/BulkUploadModal';
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
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const fetchOptions = async () => {
        try {
            const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;
            const promises = [getTaskStatuses()];
            if (!isStaff) {
                if (activeProjectId) {
                    promises.push(getProjectMembers(activeProjectId));
                } else {
                    promises.push(getStaffList());
                }
            }

            const results = await Promise.all(promises);
            const statusesData = results[0];
            const staffData = (!isStaff) ? results[1] : [];

            setStatusOptions(statusesData.map(s => ({ label: s.name, value: s._id })));
            if (!isStaff) {
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

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalItems, setTotalItems] = useState(0);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = {
                category,
                page: currentPage,
                limit: pageSize
            };
            if (activeProjectId) params.project = activeProjectId;
            if (statusFilter) params.status = statusFilter;
            if (assigneeFilter) params.assignee = assigneeFilter;
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const response = await getTasks(params);

            // Handle both paginated and non-paginated backends safely
            if (response.data && response.pagination) {
                setTasks(response.data);
                setTotalItems(response.pagination.totalItems);
            } else {
                setTasks(response);
                setTotalItems(response.length);
            }
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
    }, [activeProjectId]);

    // Reset to page 1 ONLY when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, assigneeFilter, debouncedSearchTerm, activeProjectId, category, pageSize]);

    // Fetch data whenever ANY of the parameters change
    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize, statusFilter, assigneeFilter, debouncedSearchTerm, activeProjectId, category]);

    // Pagination logic (now reflects actual server data)
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedTasks = tasks;

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${itemName}?`)) return;
        try {
            await deleteTask(id);
            toast({ title: `${isIssue ? 'Issue' : 'Task'} deleted`, status: 'success' });
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

            toast({ title: `${isIssue ? 'Issue' : 'Task'} updated`, status: 'success' });
        } catch (error) {
            toast({
                title: 'Update failed',
                description: error.response?.data?.message || `Could not update ${itemName}`,
                status: 'error'
            });
        }
    };

    const canUpdate = hasPermission(currentUser, 'tasks-update');
    const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;

    // Dynamic text based on category
    const isIssue = category === 'ISSUE';
    const createRoute = isIssue ? ROUTES.CREATE_ISSUE : ROUTES.CREATE_TASK;
    const editRouteBase = isIssue ? ROUTES.ISSUES : ROUTES.TASKS;
    const titleText = isIssue ? 'Issues' : 'Tasks';
    const createText = isIssue ? 'Create Issue' : 'Create Task';
    const itemName = isIssue ? 'issue' : 'task';

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
                render: (task) => {
                    let currentOptions = assigneeOptions;

                    // If viewing all projects, derive options from the task's populated project members
                    if (!activeProjectId && task.project && Array.isArray(task.project.members)) {
                        const filteredMembers = task.project.members.filter(u => {
                            const roleName = u.role?.name || u.role;
                            return roleName !== ROLES.ADMIN;
                        });
                        currentOptions = filteredMembers.map(u => ({ label: u.name, value: u._id }));
                    }

                    // Make sure the current assignee is always included in the options
                    const optionsWithCurrent = [...currentOptions];
                    if (task.assignee && !optionsWithCurrent.some(opt => opt.value === task.assignee._id)) {
                        optionsWithCurrent.push({ label: task.assignee.name, value: task.assignee._id });
                    }

                    return (
                        <TableSelect
                            value={task.assignee?._id || ''}
                            options={optionsWithCurrent}
                            onChange={(val) => handleUpdateTask(task._id, 'assignee', val)}
                            isDisabled={!canUpdate}
                            placeholder="Unassigned"
                        />
                    );
                }
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
    }, [statusOptions, assigneeOptions, canUpdate, isStaff, currentUser, editRouteBase]);

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">{titleText}</Heading>
                <HStack spacing={4}>
                    <CanAccess permission="tasks-create">
                        <Button leftIcon={<FiUpload />} variant="outline" onClick={() => setIsBulkUploadModalOpen(true)}>
                            Bulk Upload
                        </Button>
                    </CanAccess>
                    <CanAccess permission="tasks-create">
                        <Link to={createRoute}>
                            <Button leftIcon={<FiPlus />} colorScheme="brand">{createText}</Button>
                        </Link>
                    </CanAccess>
                </HStack>
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

            <BulkUploadModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
                category={category}
                onSuccess={() => {
                    fetchTasks();
                }}
            />
        </Box>
    );
};

export default TaskList;
