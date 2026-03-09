import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    VStack,
    HStack,
    Badge,
    useToast,
    Box,
    Divider
} from '@chakra-ui/react';
import { respondToReview } from '../../api/document.api';
import EmptyState from '../../components/feedback/EmptyState';
import { FiInbox } from 'react-icons/fi';

const ReviewRequestModal = ({ isOpen, onClose, document, onSuccess }) => {
    const toast = useToast();
    const [processingId, setProcessingId] = useState(null);

    const handleRespond = async (requestId, status) => {
        try {
            setProcessingId(requestId);
            await respondToReview(document._id, requestId, status);
            toast({
                title: `Request ${status}`,
                status: 'success',
            });
            onSuccess();
            onClose(); // Automatically close the modal after an action
        } catch (error) {
            toast({
                title: 'Failed to respond',
                description: error.response?.data?.message || 'Error occurred',
                status: 'error',
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (!document) return null;

    const pendingRequests = document.reviewRequests?.filter(r => r.status === 'pending') || [];
    const pastRequests = document.reviewRequests?.filter(r => r.status !== 'pending') || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Review Requests for {document.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Text mb={4} color="gray.600" fontSize="sm">
                        Manage file access requests for this document.
                    </Text>

                    <VStack align="stretch" spacing={4}>
                        {pendingRequests.length === 0 ? (
                            <Box py={6}>
                                <EmptyState title="No pending requests" description="You're all caught up." icon={FiInbox} />
                            </Box>
                        ) : (
                            pendingRequests.map(req => (
                                <Box key={req._id} p={4} borderWidth={1} borderRadius="md" bg="blue.50" borderColor="blue.100">
                                    <HStack justify="space-between">
                                        <Box>
                                            <Text fontWeight="bold">{req.requestedBy?.name}</Text>
                                            <Text fontSize="sm" color="gray.600">{req.requestedBy?.email}</Text>
                                        </Box>
                                        <HStack>
                                            <Button
                                                size="sm"
                                                colorScheme="green"
                                                isLoading={processingId === req._id}
                                                onClick={() => handleRespond(req._id, 'accepted')}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="red"
                                                variant="outline"
                                                isLoading={processingId === req._id}
                                                onClick={() => handleRespond(req._id, 'declined')}
                                            >
                                                Decline
                                            </Button>
                                        </HStack>
                                    </HStack>
                                </Box>
                            ))
                        )}

                        {pastRequests.length > 0 && (
                            <>
                                <Divider my={4} />
                                <Text fontWeight="bold" fontSize="sm" color="gray.500" textTransform="uppercase">
                                    Past Requests
                                </Text>
                                <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
                                    {pastRequests.map(req => (
                                        <HStack key={req._id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                                            <Text fontSize="sm">{req.requestedBy?.name}</Text>
                                            <Badge colorScheme={req.status === 'accepted' ? 'green' : 'red'}>
                                                {req.status}
                                            </Badge>
                                        </HStack>
                                    ))}
                                </VStack>
                            </>
                        )}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ReviewRequestModal;
