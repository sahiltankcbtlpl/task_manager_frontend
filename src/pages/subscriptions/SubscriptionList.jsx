import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Heading,
    Button,
    HStack,
    Badge,
    useToast,
    useDisclosure,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Text,
    VStack
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getSubscriptions, deleteSubscription } from '../../api/subscription.api';
import CanAccess from '../../components/common/CanAccess';
import TableActions from '../../components/common/TableActions';
import { ROUTES } from '../../config/routes.config';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';

const SubscriptionList = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { user: currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Delete Confirmation State
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const cancelRef = useRef();
    const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const params = {};
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;
            const data = await getSubscriptions(params);
            setSubscriptions(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load subscription plans',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [debouncedSearchTerm]);

    const confirmDelete = (id) => {
        setSubscriptionToDelete(id);
        onAlertOpen();
    };

    const handleDelete = async () => {
        if (!subscriptionToDelete) return;
        try {
            await deleteSubscription(subscriptionToDelete);
            toast({
                title: 'Subscription Plan Deleted',
                status: 'success',
            });
            fetchSubscriptions();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete subscription plan',
                status: 'error',
            });
        } finally {
            onAlertClose();
            setSubscriptionToDelete(null);
        }
    };

    // Pagination logic
    const totalItems = subscriptions.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedSubscriptions = subscriptions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    const columns = [
        {
            header: 'Plan Name',
            accessor: 'name',
            render: (sub) => <Box fontWeight="medium">{sub.name}</Box>
        },
        {
            header: 'Duration',
            accessor: 'duration',
            render: (sub) => <Badge colorScheme="blue">{sub.duration}</Badge>
        },
        {
            header: 'Price',
            accessor: 'price',
            render: (sub) => <Text fontWeight="bold">₹{sub.price}</Text>
        },
        {
            header: 'Features',
            render: (sub) => (
                <VStack align="start" spacing={0}>
                    {sub.features.map((f, i) => (
                        <Text key={i} fontSize="xs">• {f.module}: {f.limit}</Text>
                    ))}
                </VStack>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (sub) => (
                <Badge colorScheme={sub.status === 'Active' ? 'green' : 'red'}>
                    {sub.status}
                </Badge>
            )
        },
        {
            header: 'Actions',
            render: (sub) => (
                <TableActions
                    onEdit={ROUTES.EDIT_SUBSCRIPTION.replace(':id', sub._id)}
                    onDelete={() => confirmDelete(sub._id)}
                    editPermission="subscriptions-update"
                    deletePermission="subscriptions-delete"
                    item={sub}
                />
            )
        }
    ];

    return (
        <Box>
            <HStack justifyContent="space-between" mb={6}>
                <Heading size="lg">Subscription Plans</Heading>
                <CanAccess permission="subscriptions-create">
                    <Button
                        leftIcon={<FiPlus />}
                        colorScheme="brand"
                        as={Link}
                        to={ROUTES.CREATE_SUBSCRIPTION}
                    >
                        Create Plan
                    </Button>
                </CanAccess>
            </HStack>

            <Box mb={4}>
                <SearchBar
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>

            <DataTable
                columns={columns}
                data={paginatedSubscriptions}
                isLoading={loading}
                emptyMessage="No subscription plans found."
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
                            Delete Subscription Plan
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

export default SubscriptionList;
