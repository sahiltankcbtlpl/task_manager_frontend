import { Box, Heading, VStack, useToast, Spinner, Center, HStack, Image, IconButton } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { updateTask, getTaskById } from '../../api/task.api';
import { getStaffList } from '../../api/user.api';
import { getTaskStatuses } from '../../api/taskStatus.api';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';
import { ROLES } from '../../constants/roles';
import CanAccess from '../../components/common/CanAccess';
import { FormikMentionTextarea } from '../../components/common/MentionTextarea';
import { useProject } from '../../context/ProjectContext';

const EditTaskSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    description: Yup.string(),
    assignee: Yup.string(),
    taskStatus: Yup.string(),
});

const EditTask = ({ category = 'TASK' }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const { activeProjectId } = useProject();
    const toast = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    const [legacyAttachment, setLegacyAttachment] = useState(null);
    const [isLegacyRemoved, setIsLegacyRemoved] = useState(false);

    const [existingAttachments, setExistingAttachments] = useState([]);
    const [existingVideoAttachments, setExistingVideoAttachments] = useState([]);
    const [removedAttachments, setRemovedAttachments] = useState([]);
    const [removedVideoAttachments, setRemovedVideoAttachments] = useState([]);

    const [previewUrls, setPreviewUrls] = useState([]);
    const [videoPreviewUrls, setVideoPreviewUrls] = useState([]);

    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            videoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls, videoPreviewUrls]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch essential data first
                const [taskData, statusData] = await Promise.all([
                    getTaskById(id),
                    getTaskStatuses()
                ]);

                // Try fetching staff list (optional for some roles)
                let staffData = [];
                try {
                    staffData = await getStaffList();
                } catch (error) {
                    console.warn('Could not fetch staff list (permission denied?)');
                }

                const filteredUsers = staffData.filter(u => {
                    const roleName = u.role?.name || u.role;
                    return roleName !== ROLES.ADMIN;
                });

                setUsers(filteredUsers.map(u => ({ label: u.name, value: u._id })));
                setStatuses(statusData
                    .filter(s => s.status === 'active')
                    .map(s => ({ label: s.name, value: s._id }))
                );

                setInitialValues({
                    name: taskData.name || '',
                    description: taskData.description || '',
                    assignee: taskData.assignee?._id || taskData.assignee || '', // Handle populated or ID
                    taskStatus: taskData.taskStatus?._id || taskData.taskStatus || '',
                    attachments: [], // For new file upload
                    videoAttachments: []
                });

                if (taskData.attachment) setLegacyAttachment(taskData.attachment);
                if (taskData.attachments) setExistingAttachments(taskData.attachments);
                if (taskData.videoAttachments) setExistingVideoAttachments(taskData.videoAttachments);

            } catch (err) {
                console.error('Failed to fetch data', err);
                toast({
                    title: 'Error',
                    description: 'Failed to load task details',
                    status: 'error',
                    duration: 3000,
                });
                navigate(ROUTES.TASKS);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, toast]);

    const handleRemoveLegacy = () => {
        setLegacyAttachment(null);
        setIsLegacyRemoved(true);
    };

    const handleRemoveExistingAttachment = (id) => {
        setRemovedAttachments(prev => [...prev, id]);
        setExistingAttachments(prev => prev.filter(att => att._id !== id));
    };

    const handleRemoveExistingVideo = (id) => {
        setRemovedVideoAttachments(prev => [...prev, id]);
        setExistingVideoAttachments(prev => prev.filter(att => att._id !== id));
    };

    const handleSubmit = async (values, actions) => {
        if (!activeProjectId) {
            toast({
                title: 'No Project Selected',
                description: 'Please select a project from the header before editing.',
                status: 'warning',
            });
            actions.setSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('project', activeProjectId);
            formData.append('category', category);

            formData.append('name', values.name);
            formData.append('description', values.description);
            formData.append('taskStatus', values.taskStatus);
            if (values.assignee) {
                formData.append('assignee', values.assignee);
            }

            if (values.attachments) {
                values.attachments.forEach(file => formData.append('attachments', file));
            }
            if (values.videoAttachments) {
                values.videoAttachments.forEach(file => formData.append('videoAttachments', file));
            }

            if (removedAttachments.length > 0) {
                formData.append('removedAttachments', JSON.stringify(removedAttachments));
            }
            if (removedVideoAttachments.length > 0) {
                formData.append('removedVideoAttachments', JSON.stringify(removedVideoAttachments));
            }
            if (isLegacyRemoved) {
                formData.append('removeLegacyAttachment', 'true');
            }

            // For update, we might not need to send all fields if using PATCH, but PUT usually expects all or handles partials.
            // Our backend updateTask handles partial updates via `||` check, so plain object worked.
            // But with FormData, we are sending fields. 

            await updateTask(id, formData);
            toast({
                title: `${isIssue ? 'Issue' : 'Task'} Updated`,
                status: 'success',
                duration: 3000,
            });
            navigate(isIssue ? ROUTES.ISSUES : ROUTES.TASKS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || `Failed to update ${isIssue ? 'issue' : 'task'}`,
                status: 'error',
                duration: 3000,
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Center h="200px">
                <Spinner size="xl" />
            </Center>
        );
    }

    const isIssue = category === 'ISSUE';

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Edit {isIssue ? 'Issue' : 'Task'}</Heading>

            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={initialValues}
                    validationSchema={EditTaskSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, setFieldValue, values }) => (
                        <Form>
                            <VStack spacing={4} align="stretch">
                                <Input
                                    name="name"
                                    label={`${isIssue ? 'Issue' : 'Task'} Title`}
                                    placeholder={isIssue ? "e.g. Broken Login Button" : "e.g. Update Website"}
                                    isDisabled={user?.role?.name === ROLES.STAFF || user?.role === ROLES.STAFF}
                                />
                                <FormikMentionTextarea
                                    name="description"
                                    label="Description"
                                    placeholder={`Describe the ${isIssue ? 'issue' : 'task'} (Type @ to mention team members)...`}
                                    isDisabled={user?.role?.name === ROLES.STAFF || user?.role === ROLES.STAFF}
                                    users={users}
                                />

                                <CanAccess permission="users-read">
                                    <Select
                                        name="assignee"
                                        label="Assign To"
                                        placeholder="Select a user"
                                        options={users}
                                        isDisabled={user?.role?.name === ROLES.STAFF || user?.role === ROLES.STAFF}
                                    />
                                </CanAccess>

                                <Select
                                    name="taskStatus"
                                    label="Status"
                                    placeholder="Select Status"
                                    options={statuses}
                                />

                                <Box>
                                    <Heading size="sm" mb={4}>Images & Documents</Heading>

                                    {/* Existing Images */}
                                    {existingAttachments.length > 0 && (
                                        <Box mb={4} p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                                            <VStack align="stretch" spacing={3}>
                                                {existingAttachments.map(att => (
                                                    <Box key={att._id} p={2} bg="white" borderRadius="sm" border="1px" borderColor="gray.200">
                                                        <HStack justify="space-between">
                                                            <HStack>
                                                                {att.mimetype?.startsWith('image/') && (
                                                                    <Image src={`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/${att.path.replace(/\\/g, '/')}`} maxH="40px" objectFit="contain" />
                                                                )}
                                                                <VStack align="start" spacing={0}>
                                                                    <Box fontWeight="medium" fontSize="sm">{att.filename}</Box>
                                                                    <Box fontSize="xs" color="gray.500">{(att.size / 1024).toFixed(2)} KB</Box>
                                                                </VStack>
                                                            </HStack>
                                                            <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleRemoveExistingAttachment(att._id)}>Remove</Button>
                                                        </HStack>
                                                    </Box>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* Legacy Attachment */}
                                    {legacyAttachment && (
                                        <Box mb={4} p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                                            <VStack align="stretch" spacing={3}>
                                                <HStack justify="space-between">
                                                    <VStack align="start" spacing={0}>
                                                        <Box fontWeight="medium" fontSize="sm">Legacy File: {legacyAttachment.filename}</Box>
                                                        <Box fontSize="xs" color="gray.500">{(legacyAttachment.size / 1024).toFixed(2)} KB</Box>
                                                    </VStack>
                                                    <Button size="xs" colorScheme="red" variant="outline" onClick={handleRemoveLegacy}>Remove</Button>
                                                </HStack>
                                                {legacyAttachment.mimetype?.startsWith('image/') && (
                                                    <Image src={`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/${legacyAttachment.path.replace(/\\/g, '/')}`} maxH="100px" objectFit="contain" />
                                                )}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* New Images Previews */}
                                    {previewUrls.length > 0 && (
                                        <Box mb={4} p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.100">
                                            <Heading size="xs" mb={2} color="blue.700">New Image Previews:</Heading>
                                            <HStack spacing={4} wrap="wrap">
                                                {previewUrls.map((url, idx) => (
                                                    <Box key={idx} position="relative" borderRadius="md" overflow="hidden" border="1px" borderColor="blue.200" bg="white">
                                                        <IconButton
                                                            aria-label="Remove image"
                                                            icon={<span>✕</span>}
                                                            size="xs"
                                                            colorScheme="red"
                                                            position="absolute"
                                                            top={1}
                                                            right={1}
                                                            onClick={() => {
                                                                const newFiles = values.attachments.filter((_, i) => i !== idx);
                                                                setFieldValue('attachments', newFiles);
                                                                const newUrls = [...previewUrls];
                                                                URL.revokeObjectURL(newUrls[idx]);
                                                                newUrls.splice(idx, 1);
                                                                setPreviewUrls(newUrls);
                                                            }}
                                                        />
                                                        <Image src={url} alt={`preview-${idx}`} maxH="100px" objectFit="contain" />
                                                    </Box>
                                                ))}
                                            </HStack>
                                        </Box>
                                    )}

                                    <Input
                                        name="attachments"
                                        label="Add Images/Docs"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        multiple
                                        value={undefined}
                                        onChange={e => {
                                            const files = Array.from(e.currentTarget.files);
                                            const newFiles = [...values.attachments, ...files];
                                            setFieldValue('attachments', newFiles);

                                            previewUrls.forEach(url => URL.revokeObjectURL(url));
                                            const newUrls = newFiles
                                                .filter(f => f.type.startsWith('image/'))
                                                .map(f => URL.createObjectURL(f));
                                            setPreviewUrls(newUrls);
                                            e.currentTarget.value = '';
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Heading size="sm" mb={4}>Videos</Heading>

                                    {/* Existing Videos */}
                                    {existingVideoAttachments.length > 0 && (
                                        <Box mb={4} p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                                            <VStack align="stretch" spacing={3}>
                                                {existingVideoAttachments.map(att => (
                                                    <Box key={att._id} p={2} bg="white" borderRadius="sm" border="1px" borderColor="gray.200">
                                                        <HStack justify="space-between">
                                                            <HStack>
                                                                <VStack align="start" spacing={0}>
                                                                    <Box fontWeight="medium" fontSize="sm">{att.filename}</Box>
                                                                    <Box fontSize="xs" color="gray.500">{(att.size / (1024 * 1024)).toFixed(2)} MB</Box>
                                                                </VStack>
                                                            </HStack>
                                                            <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleRemoveExistingVideo(att._id)}>Remove</Button>
                                                        </HStack>
                                                        <Box mt={2} borderRadius="md" overflow="hidden" border="1px" borderColor="purple.200" bg="black" w="max-content">
                                                            <video src={`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/${att.path.replace(/\\/g, '/')}`} controls style={{ maxHeight: '150px' }} />
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    {/* New Video Previews */}
                                    {videoPreviewUrls.length > 0 && (
                                        <Box mb={4} p={3} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.100">
                                            <Heading size="xs" mb={2} color="purple.700">New Video Previews:</Heading>
                                            <HStack spacing={4} wrap="wrap">
                                                {videoPreviewUrls.map((url, idx) => (
                                                    <Box key={idx} position="relative" borderRadius="md" overflow="hidden" border="1px" borderColor="purple.200" bg="black">
                                                        <IconButton
                                                            aria-label="Remove video"
                                                            icon={<span>✕</span>}
                                                            size="xs"
                                                            colorScheme="red"
                                                            position="absolute"
                                                            top={1}
                                                            right={1}
                                                            zIndex={2}
                                                            onClick={() => {
                                                                const newFiles = values.videoAttachments.filter((_, i) => i !== idx);
                                                                setFieldValue('videoAttachments', newFiles);
                                                                const newUrls = [...videoPreviewUrls];
                                                                URL.revokeObjectURL(newUrls[idx]);
                                                                newUrls.splice(idx, 1);
                                                                setVideoPreviewUrls(newUrls);
                                                            }}
                                                        />
                                                        <video src={url} controls style={{ maxHeight: '100px' }} />
                                                    </Box>
                                                ))}
                                            </HStack>
                                        </Box>
                                    )}

                                    <Input
                                        name="videoAttachments"
                                        label="Add Videos"
                                        type="file"
                                        accept=".mp4,.webm,.ogg"
                                        multiple
                                        value={undefined}
                                        onChange={e => {
                                            const files = Array.from(e.currentTarget.files);
                                            const newFiles = [...values.videoAttachments, ...files];
                                            setFieldValue('videoAttachments', newFiles);

                                            videoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
                                            const newUrls = newFiles
                                                .filter(f => f.type.startsWith('video/'))
                                                .map(f => URL.createObjectURL(f));
                                            setVideoPreviewUrls(newUrls);
                                            e.currentTarget.value = '';
                                        }}
                                    />
                                </Box>

                                <HStack spacing={4} mt={4}>
                                    <Button type="submit" isLoading={isSubmitting}>
                                        Update {isIssue ? 'Issue' : 'Task'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate(isIssue ? ROUTES.ISSUES : ROUTES.TASKS)}
                                    >
                                        Cancel
                                    </Button>
                                </HStack>
                            </VStack>
                        </Form>
                    )}
                </Formik>
            </Box>
        </Box>
    );
};

export default EditTask;
