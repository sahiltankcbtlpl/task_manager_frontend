import React, { useEffect, useState } from 'react';
import {
    Box,
    Heading,
    Button,
    IconButton,
    HStack,
    Badge,
    useToast,
    Spinner,
    Center
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { getRoles, deleteRole } from '../../api/role.api';
import CanAccess from '../../components/common/CanAccess';
import TableActions from '../../components/common/TableActions';
import { ROUTES } from '../../config/routes.config';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import { hasPermission } from '../../utils/permissions';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';

const RoleList = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const fetchRoles = async () => {
        try {
            const params = {};
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;
            const data = await getRoles(params);
            setRoles(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load roles',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [debouncedSearchTerm]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await deleteRole(id);
                toast({
                    title: 'Role Deleted',
                    status: 'success',
                });
                fetchRoles();
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'Failed to delete role',
                    status: 'error',
                });
            }
        }
    };

    // Search and filtering moved to backend
    const filteredRoles = roles;

    // Pagination logic
    const totalItems = filteredRoles.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedRoles = filteredRoles.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (role) => <Box fontWeight="medium">{role.name}</Box>
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (role) => (
                <Badge colorScheme={role.status === 'Active' ? 'green' : 'red'}>
                    {role.status}
                </Badge>
            )
        },
    ];

    if (hasPermission(currentUser, 'roles-update') || hasPermission(currentUser, 'roles-delete')) {
        columns.push({
            header: 'Actions',
            render: (role) => (
                <TableActions
                    onEdit={ROUTES.EDIT_ROLE.replace(':id', role._id)}
                    onDelete={() => handleDelete(role._id)}
                    editPermission="roles-update"
                    deletePermission="roles-delete"
                    isDeleteDisabled={role.name === 'Super Admin'}
                    item={role}
                />
            )
        });
    }


    return (
        <Box>
            <HStack justifyContent="space-between" mb={6}>
                <Heading size="lg">Roles</Heading>
                <CanAccess permission="roles-create">
                    <Button
                        leftIcon={<FiPlus />}
                        colorScheme="brand"
                        as={Link}
                        to={ROUTES.CREATE_ROLE}
                    >
                        Create Role
                    </Button>
                </CanAccess>
            </HStack>

            <Box mb={4}>
                <SearchBar
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>

            <DataTable
                columns={columns}
                data={paginatedRoles}
                isLoading={loading}
                emptyMessage="No roles found."
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

export default RoleList;
