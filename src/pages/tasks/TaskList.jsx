import Pagination from '../../components/common/Pagination';
import {
    Box,
    Heading,
    Flex,
    Button,
    IconButton,
    useToast,
    HStack,
    useDisclosure,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Tooltip,
} from '@chakra-ui/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { getTasks, deleteTask, updateTask } from '../../api/task.api';

import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiCheckSquare, FiAlertCircle, FiUpload, FiList, FiGrid } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';
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
import useSocket from '../../hooks/useSocket';
import KanbanBoard from '../../components/tasks/kanban/KanbanBoard';



const TaskList = ({ category = 'TASK' }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { user: currentUser, activeCompany } = useAuth();
    const { activeProjectId } = useProject();
    const socket = useSocket();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    // ── View mode (URL-driven) ────────────────────────────────────────────────
    const viewMode = searchParams.get('view') === 'kanban' ? 'kanban' : 'list';

    const switchView = (mode) => {
        const newParams = new URLSearchParams(searchParams);
        if (mode === 'kanban') {
            newParams.set('view', 'kanban');
        } else {
            newParams.delete('view'); // Default is list
        }
        setSearchParams(newParams);
    };

    // ── Filter / search state ────────────────────────────────────────────────
    const [statusOptions, setStatusOptions] = useState([]);
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const uniqueStatusOptions = useMemo(() => {
        const uniqueMap = new Map();
        statusOptions.forEach(opt => {
            const labelLower = opt.label.trim().toLowerCase();
            if (!uniqueMap.has(labelLower)) {
                uniqueMap.set(labelLower, opt);
            }
        });
        return Array.from(uniqueMap.values());
    }, [statusOptions]);

    // ── Modal state ──────────────────────────────────────────────────────────
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    // ── Delete confirmation ──────────────────────────────────────────────────
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const cancelRef = useRef();
    const [taskToDelete, setTaskToDelete] = useState(null);

    // ── Data fetching ────────────────────────────────────────────────────────
    const fetchOptions = async () => {
        try {
            const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;
            const promises = [getTaskStatuses({ project: activeProjectId })];
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

            setStatusOptions(statusesData.map(s => ({ label: s.name, value: s._id, project: s.project })));
            if (!isStaff) {
                const filteredStaff = staffData.filter(u => {
                    const roleName = u.role?.name || u.role;
                    return roleName !== ROLES.ADMIN && roleName !== ROLES.OWNER;
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
    }, [activeProjectId, activeCompany]);

    // Reset to page 1 when filters/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, assigneeFilter, debouncedSearchTerm, activeProjectId, category, pageSize]);

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize, statusFilter, assigneeFilter, debouncedSearchTerm, activeProjectId, category]);

    // Real-time updates via socket
    useEffect(() => {
        if (!socket) return;

        const handleTaskChange = () => { fetchTasks(); };

        socket.on('taskCreated', handleTaskChange);
        socket.on('taskUpdated', handleTaskChange);
        socket.on('taskDeleted', handleTaskChange);

        return () => {
            socket.off('taskCreated', handleTaskChange);
            socket.off('taskUpdated', handleTaskChange);
            socket.off('taskDeleted', handleTaskChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, currentPage, pageSize, statusFilter, assigneeFilter, debouncedSearchTerm, activeProjectId, category]);

    // ── Pagination ───────────────────────────────────────────────────────────
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedTasks = tasks;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const confirmDelete = (id) => {
        setTaskToDelete(id);
        onAlertOpen();
    };

    const handleDelete = async () => {
        if (!taskToDelete) return;
        try {
            await deleteTask(taskToDelete);
            toast({ title: `${isIssue ? 'Issue' : 'Task'} deleted`, status: 'success' });
            fetchTasks();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', status: 'error' });
        } finally {
            onAlertClose();
            setTaskToDelete(null);
        }
    };

    const handleUpdateTask = async (id, field, value) => {
        try {
            const updatedTaskData = await updateTask(id, { [field]: value });
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

    // ── Derived values ────────────────────────────────────────────────────────
    const canUpdate = hasPermission(currentUser, 'tasks-update');
    const isStaff = currentUser?.role?.name === ROLES.STAFF || currentUser?.role === ROLES.STAFF;
    const isIssue = category === 'ISSUE';
    const createRoute = isIssue ? ROUTES.CREATE_ISSUE : ROUTES.CREATE_TASK;
    const editRouteBase = isIssue ? ROUTES.ISSUES : ROUTES.TASKS;
    const titleText = isIssue ? 'Issues' : 'Tasks';
    const createText = isIssue ? 'Create Issue' : 'Create Task';
    const itemName = isIssue ? 'issue' : 'task';

    const handleCreateClick = () => {
        if (!activeProjectId) {
            toast({
                title: 'No Project Selected',
                description: `Please select a project from the header before creating a ${itemName}.`,
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        navigate(createRoute);
    };

    // ── List-view columns (unchanged) ─────────────────────────────────────────
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
                render: (task) => {
                    const projectStatuses = !activeProjectId && task.project
                        ? statusOptions.filter(opt => opt.project === (task.project._id || task.project))
                        : statusOptions;

                    return (
                        <TableSelect
                            value={task.taskStatus?._id || ''}
                            options={projectStatuses}
                            onChange={(val) => handleUpdateTask(task._id, 'taskStatus', val)}
                            isDisabled={!canUpdate}
                            placeholder="Select Status"
                        />
                    );
                }
            }
        ];

        if (!isStaff) {
            cols.push({
                header: 'Assignee',
                accessor: 'assignee',
                render: (task) => {
                    let currentOptions = assigneeOptions;

                    if (!activeProjectId && task.project && Array.isArray(task.project.members)) {
                        const filteredMembers = task.project.members.filter(u => {
                            const roleName = u.role?.name || u.role;
                            return roleName !== ROLES.ADMIN;
                        });
                        currentOptions = filteredMembers.map(u => ({ label: u.name, value: u._id }));
                    }

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
                        onDelete={() => confirmDelete(task._id)}
                        editPermission="tasks-update"
                        deletePermission="tasks-delete"
                        item={task}
                    />
                )
            });
        }

        return cols;
    }, [statusOptions, assigneeOptions, canUpdate, isStaff, currentUser, editRouteBase]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">{titleText}</Heading>
                <HStack spacing={3}>
                    {/* View toggle */}
                    <HStack
                        spacing={0}
                        bg="gray.100"
                        borderRadius="lg"
                        p={1}
                    >
                        <Tooltip label="List View" hasArrow placement="top">
                            <IconButton
                                icon={<FiList />}
                                aria-label="List View"
                                size="sm"
                                variant={viewMode === 'list' ? 'solid' : 'ghost'}
                                colorScheme={viewMode === 'list' ? 'brand' : 'gray'}
                                onClick={() => switchView('list')}
                                borderRadius="md"
                            />
                        </Tooltip>
                        <Tooltip label="Kanban View" hasArrow placement="top">
                            <IconButton
                                icon={<FiGrid />}
                                aria-label="Kanban View"
                                size="sm"
                                variant={viewMode === 'kanban' ? 'solid' : 'ghost'}
                                colorScheme={viewMode === 'kanban' ? 'brand' : 'gray'}
                                onClick={() => switchView('kanban')}
                                borderRadius="md"
                            />
                        </Tooltip>
                    </HStack>

                    <CanAccess permission="tasks-create">
                        <Button leftIcon={<FiUpload />} variant="outline" onClick={() => setIsBulkUploadModalOpen(true)}>
                            Bulk Upload
                        </Button>
                    </CanAccess>
                    <CanAccess permission="tasks-create">
                        <Button
                            leftIcon={<FiPlus />}
                            colorScheme="brand"
                            onClick={handleCreateClick}
                        >
                            {createText}
                        </Button>
                    </CanAccess>
                </HStack>
            </Flex>

            {/* ── Filters / Search ─────────────────────────────────────────── */}
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
                    options={uniqueStatusOptions}
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

            {/* ── Main content: List or Kanban ─────────────────────────────── */}
            {viewMode === 'list' ? (
                <>
                    {loading ? (
                        <DataTable columns={columns} data={[]} isLoading={true} />
                    ) : tasks.length === 0 ? (
                        <EmptyState
                            title={`No ${titleText}`}
                            description={`Create a ${itemName} to get started`}
                            icon={isIssue ? FiAlertCircle : FiCheckSquare}
                        />
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
                </>
            ) : (
                /* Kanban view — passes all shared state/handlers down */
                <>
                    {!loading && tasks.length === 0 ? (
                        <EmptyState
                            title={`No ${titleText}`}
                            description={`Create a ${itemName} to get started`}
                            icon={isIssue ? FiAlertCircle : FiCheckSquare}
                        />
                    ) : (
                        <KanbanBoard
                            tasks={paginatedTasks}
                            statusOptions={statusOptions}
                            assigneeOptions={assigneeOptions}
                            isLoading={loading}
                            canUpdate={canUpdate}
                            isStaff={isStaff}
                            currentUser={currentUser}
                            isIssue={isIssue}
                            editRouteBase={editRouteBase}
                            onViewTask={handleViewTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={confirmDelete}
                            activeProjectId={activeProjectId}
                        />
                    )}
                    {/* Pagination in Kanban view */}
                    {!loading && tasks.length > 0 && (
                        <Box mt={4} bg="white" shadow="md" borderRadius="lg" p={3}>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                pageSize={pageSize}
                                onPageSizeChange={setPageSize}
                                totalItems={totalItems}
                            />
                        </Box>
                    )}
                </>
            )}

            {/* ── Modals ───────────────────────────────────────────────────── */}
            <TaskDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
            />

            <BulkUploadModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
                category={category}
            />

            {/* Delete Confirmation Alert */}
            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onAlertClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete {isIssue ? 'Issue' : 'Task'}
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure? You can't undo this action afterwards.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onAlertClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default TaskList;
