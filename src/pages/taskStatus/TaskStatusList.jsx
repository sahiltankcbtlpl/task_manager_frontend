import { Box, Heading, Flex, Button, useToast, Badge, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { getTaskStatuses, deleteTaskStatus } from '../../api/taskStatus.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiList } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';
import CanAccess from '../../components/common/CanAccess';
import TableActions from '../../components/common/TableActions';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import useAuth from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import useDebounce from '../../hooks/useDebounce';

import { useProject } from '../../context/ProjectContext';

const TaskStatusList = () => {
    const { user: currentUser } = useAuth();
    const { activeProjectId } = useProject();
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Delete Confirmation State
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const cancelRef = useRef();
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchStatuses = async () => {
        if (!activeProjectId) {
            setStatuses([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const params = { project: activeProjectId };
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;
            const data = await getTaskStatuses(params);
            setStatuses(data);
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
        fetchStatuses();
    }, [debouncedSearchTerm, activeProjectId]);

    // Helper to reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, activeProjectId]);

    const confirmDelete = (id) => {
        setItemToDelete(id);
        onAlertOpen();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteTaskStatus(itemToDelete);
            toast({ title: 'Status deleted', status: 'success' });
            fetchStatuses();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', status: 'error' });
        } finally {
            onAlertClose();
            setItemToDelete(null);
        }
    };

    // Filter Logic
    const filteredStatuses = statuses;

    // Pagination Logic
    const totalItems = filteredStatuses.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedStatuses = filteredStatuses.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );




    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (item) => <Box fontWeight="bold">{item.name}</Box>
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (item) => (
                <Badge colorScheme={item.status === 'active' ? 'green' : 'red'}>
                    {item.status.toUpperCase()}
                </Badge>
            )
        }
    ];

    if (hasPermission(currentUser, 'task_status-update') || hasPermission(currentUser, 'task_status-delete')) {
        columns.push({
            header: 'Actions',
            render: (item) => (
                <TableActions
                    onEdit={`${ROUTES.TASK_STATUS}/edit/${item._id}`}
                    onDelete={() => confirmDelete(item._id)}
                    editPermission="task_status-update"
                    deletePermission="task_status-delete"
                    item={item}
                />
            )
        });
    }

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Task Status</Heading>
                <CanAccess permission="task_status-create">
                    <Link to={ROUTES.CREATE_TASK_STATUS}>
                        <Button leftIcon={<FiPlus />} colorScheme="brand">Create Task Status</Button>
                    </Link>
                </CanAccess>
            </Flex>

            <Flex mb={4}>
                <SearchBar
                    placeholder="Search status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Flex>

            {loading ? (
                <DataTable
                    columns={columns}
                    data={[]}
                    isLoading={true}
                />
            ) : !activeProjectId ? (
                <EmptyState title="No Project Selected" description="Please select a project from the header to manage its task statuses" icon={FiList} />
            ) : statuses.length === 0 ? (
                <EmptyState title="No Status" description="Create a status to get started with this project" icon={FiList} />
            ) : (
                <DataTable
                    columns={columns}
                    data={paginatedStatuses}
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

            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onAlertClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Task Status
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

export default TaskStatusList;
