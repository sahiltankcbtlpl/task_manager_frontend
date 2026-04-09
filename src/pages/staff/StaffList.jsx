import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Heading,
    Text,
    Button,
    IconButton,
    HStack,
    Badge,
    useToast,
    Flex,
    useDisclosure,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay
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
import { ROLES } from '../../constants/roles';
import useDebounce from '../../hooks/useDebounce';

const StaffList = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [roleOptions, setRoleOptions] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Delete Confirmation State
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const cancelRef = useRef();
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchOptions = async () => {
        try {
            const rolesData = await getRoles();
            const filteredRoles = rolesData.filter(r => (r.name || r) !== ROLES.ADMIN);
            setRoleOptions(filteredRoles.map(r => ({ label: r.name || r, value: r._id || r })));
        } catch (error) {
            console.error('Error fetching role options:', error);
        }
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // Pass role filter and search to getStaffList
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const staffData = await getStaffList(params);
            setStaff(staffData);
        } catch (error) {
            toast({
                title: 'Error fetching staff',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter, debouncedSearchTerm]);

    const confirmDelete = (id) => {
        setUserToDelete(id);
        onAlertOpen();
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteStaff(userToDelete);
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
        } finally {
            onAlertClose();
            setUserToDelete(null);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Initial filtering by removing current user
    const baseStaff = staff.filter(user => user._id !== currentUser?._id);

    // Search logic moved to backend, filteredStaff is now just baseStaff
    const filteredStaff = baseStaff;

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
    }, [debouncedSearchTerm]);



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
                    onDelete={() => confirmDelete(user._id)}
                    editPermission="users-update"
                    deletePermission="users-delete"
                    item={user}
                />
            )
        });
    }

    return (
        <Box maxW="1200px" mx="auto" py={4}>
            <Flex justify="space-between" align="center" mb={8}>
                <Box>
                    <Heading size="lg" color="gray.800">User Management</Heading>
                    <Text color="gray.500" mt={1}>Manage and monitor your team member access</Text>
                </Box>
                <Box>
                    <CanAccess permission="users-create">
                        <Link to={ROUTES.CREATE_STAFF}>
                            <Button
                                leftIcon={<FiPlus />}
                                colorScheme="brand"
                                size="lg"
                                shadow="md"
                                _hover={{ shadow: 'lg', transform: 'translateY(-1px)' }}
                                transition="all 0.2s"
                            >
                                Create User
                            </Button>
                        </Link>
                    </CanAccess>
                </Box>
            </Flex>

            <Flex mb={6} gap={4} wrap="wrap">
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

            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onAlertClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete User
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

export default StaffList;
