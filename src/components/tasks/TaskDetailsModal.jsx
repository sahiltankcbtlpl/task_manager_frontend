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
    Box,
    Image,
    Link,
    Icon,
    HStack,
    Badge
} from '@chakra-ui/react';
import { FiDownload, FiFile, FiVideo } from 'react-icons/fi';

const TaskDetailsModal = ({ isOpen, onClose, task }) => {
    if (!task) return null;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api$/, ''); // Remove trailing /api if present

    const attachmentUrl = task.attachment
        ? `${baseUrl}/${task.attachment.path.replace(/\\/g, '/')}`
        : null;

    // Helper to determine file type for display
    const isImage = task.attachment?.mimetype?.startsWith('image/');
    const isVideo = task.attachment?.mimetype?.startsWith('video/');

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{task.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        <Box>
                            <Badge colorScheme={task.taskStatus?.status === 'active' ? 'green' : 'gray'} mb={2}>
                                {task.taskStatus?.name}
                            </Badge>
                            <Text fontSize="sm" color="gray.500">
                                Assigned to: <Text as="span" fontWeight="bold">{task.assignee?.name}</Text>
                            </Text>
                        </Box>

                        <Box>
                            <Text fontWeight="bold" mb={1}>Description</Text>
                            <Text whiteSpace="pre-wrap">{task.description}</Text>
                        </Box>

                        {task.attachment && (
                            <Box mt={4}>
                                <Text fontWeight="bold" mb={2}>Attachment</Text>
                                <Box border="1px" borderColor="gray.200" borderRadius="md" p={4} bg="gray.50">
                                    {isImage ? (
                                        <Image
                                            src={attachmentUrl}
                                            alt="Task Attachment"
                                            maxH="300px"
                                            objectFit="contain"
                                            mx="auto"
                                            fallbackSrc="https://via.placeholder.com/300?text=Image+Not+Found"
                                        />
                                    ) : isVideo ? (
                                        <video controls width="100%" style={{ maxHeight: '300px' }}>
                                            <source src={attachmentUrl} type={task.attachment.mimetype} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <HStack>
                                            <Icon as={FiFile} boxSize={6} color="gray.500" />
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="medium">{task.attachment.filename}</Text>
                                                <Text fontSize="xs" color="gray.500">{(task.attachment.size / 1024).toFixed(2)} KB</Text>
                                            </VStack>
                                        </HStack>
                                    )}

                                    <HStack mt={3} justify="flex-end">
                                        <Link href={attachmentUrl} download isExternal>
                                            <Button size="sm" leftIcon={<FiDownload />} variant="outline">
                                                Download
                                            </Button>
                                        </Link>
                                    </HStack>
                                </Box>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default TaskDetailsModal;
