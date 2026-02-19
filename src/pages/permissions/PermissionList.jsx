import { Box, Heading, Flex, IconButton, Badge, Tag, HStack, useToast } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import TableActions from '../../components/common/TableActions';
import CanAccess from '../../components/common/CanAccess';
import SearchBar from '../../components/common/SearchBar';
import { ROUTES } from '../../config/routes.config';
import { useEffect, useState } from 'react';
import { getPermissions, deletePermission } from '../../api/permission.api';
import { hasPermission } from '../../utils/permissions';
import useAuth from '../../hooks/useAuth';

const PermissionList = () => {
    const [permissions, setPermissions] = useState([]);
    const [filteredPermissions, setFilteredPermissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const { user: currentUser } = useAuth();

    const fetchPermissions = async () => {
        try {
            const data = await getPermissions();
            setPermissions(data);
            setFilteredPermissions(data);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to fetch permissions',
                status: 'error'
            });
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    useEffect(() => {
        const results = permissions.filter(perm =>
            perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            perm.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPermissions(results);
        setCurrentPage(1); // Reset to first page on search
    }, [searchTerm, permissions]);

    // Pagination logic
    const totalItems = filteredPermissions.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedPermissions = filteredPermissions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this permission?')) return;
        try {
            await deletePermission(id);
            toast({ title: 'Permission deleted', status: 'success' });
            fetchPermissions();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', status: 'error' });
        }
    };

    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (perm) => <Box fontWeight="medium">{perm.name}</Box>
        },
        {
            header: 'Value',
            accessor: 'value',
            render: (perm) => (
                <Tag colorScheme="blue" variant="subtle">{perm.value}</Tag>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (perm) => (
                <Badge colorScheme={perm.status === 'active' ? 'green' : 'red'}>
                    {perm.status}
                </Badge>
            )
        },
    ];

    if (hasPermission(currentUser, 'permissions-update') || hasPermission(currentUser, 'permissions-delete')) {
        columns.push({
            header: 'Actions',
            render: (perm) => (
                <TableActions
                    onEdit={ROUTES.EDIT_PERMISSION.replace(':id', perm._id)}
                    onDelete={() => handleDelete(perm._id)}
                    editPermission="permissions-update"
                    deletePermission="permissions-delete"
                    item={perm}
                />
            )
        });
    }

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Permissions</Heading>
                <CanAccess permission="permissions-create">
                    <Link to={ROUTES.CREATE_PERMISSION}>
                        <Button leftIcon={<FiPlus />} colorScheme="brand">Create Permission</Button>
                    </Link>
                </CanAccess>
            </Flex>

            <Box mb={4}>
                <SearchBar
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>

            <DataTable
                columns={columns}
                data={paginatedPermissions}
                emptyMessage="No permissions found."
                pagination={{
                    currentPage,
                    totalPages,
                    onPageChange: setCurrentPage,
                    pageSize,
                    onPageSizeChange: setPageSize,
                    totalItems
                }}
            />
        </Box>
    );
};

export default PermissionList;
