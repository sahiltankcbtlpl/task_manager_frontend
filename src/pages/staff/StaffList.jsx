import React, { useEffect, useState } from 'react';
import {
    Box,
    Heading,
    Button,
    IconButton,
    HStack,
    Badge,
    useToast,
    Flex
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { getStaffList, deleteStaff, updateStaff } from '../../api/user.api';
import CanAccess from '../../components/common/CanAccess';
import TableActions from '../../components/common/TableActions';

import { ROUTES } from '../../config/routes.config';
import useAuth from '../../hooks/useAuth';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import TableFilter from '../../components/common/TableFilter';
import { hasPermission } from '../../utils/permissions';
import { getRoles } from '../../api/role.api';

const StaffList = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [roleOptions, setRoleOptions] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // Pass role filter to getStaffList
            const params = {};
            if (roleFilter) params.role = roleFilter;

            const [staffData, rolesData] = await Promise.all([
                getStaffList(params),
                getRoles()
            ]);
            setStaff(staffData);
            setRoleOptions(rolesData.map(r => ({ label: r.name, value: r._id }))); // Use ID for value
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
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteStaff(id);
                toast({
                    title: 'User deleted',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                fetchStaff(); // Refresh list
            } catch (error) {
                toast({
                    title: 'Error deleting user',
                    description: error.response?.data?.message || 'Failed to delete',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };



    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Initial filtering by removing current user
    const baseStaff = staff.filter(user => user._id !== currentUser?._id);

    // Search logic only (Role filtering moves to backend)
    const filteredStaff = baseStaff.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    // Pagination logic
    const totalItems = filteredStaff.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);



    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (user) => <Box fontWeight="medium">{user.name}</Box>
        },
        {
            header: 'Email',
            accessor: 'email',
        },
        {
            header: 'Role',
            accessor: 'role',
            render: (user) => (
                <Box>
                    {user.role?.name || roleOptions.find(r => r.value === user.role)?.label || 'N/A'}
                </Box>
            )
        },
        {
            header: 'Status',
            render: () => <Badge colorScheme="green">Active</Badge>
        },
    ];

    if (hasPermission(currentUser, 'users-update') || hasPermission(currentUser, 'users-delete')) {
        columns.push({
            header: 'Actions',
            render: (user) => (
                <TableActions
                    onEdit={`/staff/${user._id}/edit`}
                    onDelete={() => handleDelete(user._id)}
                    editPermission="users-update"
                    deletePermission="users-delete"
                    item={user}
                />
            )
        });
    }

    return (
        <Box>
            <HStack justify="space-between" mb={6}>
                <Heading size="lg">User Management</Heading>
                <CanAccess permission="users-create">
                    <Button
                        as={Link}
                        to={ROUTES.CREATE_STAFF}
                        leftIcon={<FiPlus />}
                        colorScheme="brand"
                    >
                        Create User
                    </Button>
                </CanAccess>
            </HStack>

            <Flex mb={4} gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                    <SearchBar
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
                <TableFilter
                    placeholder="Filter by Role"
                    options={roleOptions}
                    value={roleFilter}
                    onChange={setRoleFilter}
                />
            </Flex>

            <DataTable
                columns={columns}
                data={paginatedStaff}
                isLoading={loading}
                emptyMessage="No users found."
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

export default StaffList;
