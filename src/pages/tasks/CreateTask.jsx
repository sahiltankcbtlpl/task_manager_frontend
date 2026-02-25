import {
    Box,
    Heading,
    VStack,
    useToast,
    HStack,
    Image,
    IconButton,
} from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import CanAccess from '../../components/common/CanAccess';

import { createTask } from '../../api/task.api';
import { getStaffList } from '../../api/user.api';
import { getTaskStatuses } from '../../api/taskStatus.api';

import { ROUTES } from '../../config/routes.config';
import { ROLES } from '../../constants/roles';

const CreateTaskSchema = Yup.object({
    name: Yup.string().required('Required'),
    description: Yup.string(),
    assignee: Yup.string(),
    taskStatus: Yup.string().required('Required'),
});

const CreateTask = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [initialValues, setInitialValues] = useState({
        name: '',
        description: '',
        assignee: '',
        taskStatus: '',
        attachments: [],
        videoAttachments: [],
    });

    const [previewUrls, setPreviewUrls] = useState([]);
    const [videoPreviewUrls, setVideoPreviewUrls] = useState([]);

    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            videoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls, videoPreviewUrls]);

    /* ---------------- Fetch dropdown data ---------------- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, statusRes] = await Promise.all([
                    getStaffList(),
                    getTaskStatuses(),
                ]);

                const staffOptions = usersRes
                    .filter(u => (u.role?.name || u.role) !== ROLES.ADMIN)
                    .map(u => ({ label: u.name, value: u._id }));

                const statusOptions = statusRes
                    .filter(s => s.status === 'active')
                    .map(s => ({ label: s.name, value: s._id }));

                setUsers(staffOptions);
                setStatuses(statusOptions);

                if (statusOptions.length) {
                    setInitialValues(prev => ({
                        ...prev,
                        taskStatus: statusOptions[0].value,
                    }));
                }
            } catch (error) {
                console.error(error);
                toast({
                    title: 'Failed to load data',
                    status: 'error',
                });
            }
        };

        fetchData();
    }, [toast]);

    /* ---------------- Submit handler ---------------- */
    const handleSubmit = async (values, actions) => {
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (key !== 'attachments' && key !== 'videoAttachments' && value) {
                    formData.append(key, value);
                }
            });

            if (values.attachments) {
                values.attachments.forEach(file => {
                    formData.append('attachments', file);
                });
            }

            if (values.videoAttachments) {
                values.videoAttachments.forEach(file => {
                    formData.append('videoAttachments', file);
                });
            }

            await createTask(formData);

            toast({
                title: 'Task Created',
                status: 'success',
                duration: 3000,
            });

            navigate(ROUTES.TASKS);
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    error.response?.data?.message || 'Failed to create task',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">
                Create New Task
            </Heading>

            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={initialValues}
                    enableReinitialize
                    validationSchema={CreateTaskSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, setFieldValue, values }) => (
                        <Form>
                            <VStack spacing={4} align="stretch">
                                <Input
                                    name="name"
                                    label="Task Title"
                                    placeholder="e.g. Update Website"
                                />

                                <Input
                                    name="description"
                                    label="Description"
                                    placeholder="Task details..."
                                />

                                <Select
                                    name="taskStatus"
                                    label="Status"
                                    options={statuses}
                                />

                                <CanAccess permission="users-read">
                                    <Select
                                        name="assignee"
                                        label="Assign To"
                                        placeholder="Select user"
                                        options={users}
                                    />
                                </CanAccess>

                                <Box>
                                    {previewUrls.length > 0 && (
                                        <Box mb={4} p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.100">
                                            <Heading size="xs" mb={2} color="blue.700">Image/Doc Previews:</Heading>
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
                                        label="Image/Doc Attachments (Optional)"
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
                                    {videoPreviewUrls.length > 0 && (
                                        <Box mb={4} p={3} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.100">
                                            <Heading size="xs" mb={2} color="purple.700">Video Previews:</Heading>
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
                                        label="Video Attachments (Optional)"
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
                                    <Button
                                        type="submit"
                                        isLoading={isSubmitting}
                                    >
                                        Create Task
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            navigate(ROUTES.TASKS)
                                        }
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

export default CreateTask;