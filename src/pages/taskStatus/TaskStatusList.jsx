import { Box, Heading, Flex, Button, useToast, Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
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

const TaskStatusList = () => {
    const { user: currentUser } = useAuth();
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const fetchStatuses = async () => {
        try {
            setLoading(true);
            const params = {};
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
    }, [debouncedSearchTerm]);

    // Helper to reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this status?')) return;
        try {
            await deleteTaskStatus(id);
            toast({ title: 'Status deleted', status: 'success' });
            fetchStatuses();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', status: 'error' });
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
                    onDelete={() => handleDelete(item._id)}
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
            ) : statuses.length === 0 ? (
                <EmptyState title="No Status" description="Create a status to get started" icon={FiList} />
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
        </Box>
    );
};

export default TaskStatusList;
