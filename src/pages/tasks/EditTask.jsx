import { Box, Heading, VStack, useToast, Spinner, Center, HStack, Image } from '@chakra-ui/react';
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
import useAuth from '../../hooks/useAuth';
import CanAccess from '../../components/common/CanAccess';

const EditTaskSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    description: Yup.string(),
    assignee: Yup.string(),
    taskStatus: Yup.string(),
});

const EditTask = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentAttachment, setCurrentAttachment] = useState(null);
    const [isFileRemoved, setIsFileRemoved] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

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
                    attachment: null // For new file upload
                });

                if (taskData.attachment) {
                    setCurrentAttachment(taskData.attachment);
                }

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

    const handleRemoveFile = () => {
        setCurrentAttachment(null);
        setIsFileRemoved(true);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (values, actions) => {
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('description', values.description);
            formData.append('taskStatus', values.taskStatus);
            if (values.assignee) {
                formData.append('assignee', values.assignee);
            }
            if (values.attachment) {
                formData.append('attachment', values.attachment);
            }
            if (isFileRemoved && !values.attachment) {
                formData.append('removeAttachment', 'true');
            }

            // For update, we might not need to send all fields if using PATCH, but PUT usually expects all or handles partials.
            // Our backend updateTask handles partial updates via `||` check, so plain object worked.
            // But with FormData, we are sending fields. 

            await updateTask(id, formData);
            toast({
                title: 'Task Updated',
                status: 'success',
                duration: 3000,
            });
            navigate(ROUTES.TASKS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update task',
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

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Edit Task</Heading>

            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={initialValues}
                    validationSchema={EditTaskSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, setFieldValue }) => (
                        <Form>
                            <VStack spacing={4} align="stretch">
                                <Input
                                    name="name"
                                    label="Task Title"
                                    placeholder="e.g. Update Website"
                                    isDisabled={user?.role?.name === ROLES.STAFF || user?.role === ROLES.STAFF}
                                />
                                <Input
                                    name="description"
                                    label="Description"
                                    placeholder="Task details..."
                                    isDisabled={user?.role?.name === ROLES.STAFF || user?.role === ROLES.STAFF}
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
                                    <Heading size="sm" mb={2}>Attachment</Heading>
                                    {currentAttachment && (
                                        <Box mb={4} p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                                            <VStack align="stretch" spacing={3}>
                                                <HStack justify="space-between">
                                                    <VStack align="start" spacing={0}>
                                                        <Box fontWeight="medium">Current File: {currentAttachment.filename}</Box>
                                                        <Box fontSize="sm" color="gray.500">
                                                            {(currentAttachment.size / 1024).toFixed(2)} KB
                                                        </Box>
                                                    </VStack>
                                                    <Button size="sm" colorScheme="red" variant="outline" onClick={handleRemoveFile}>
                                                        Remove
                                                    </Button>
                                                </HStack>
                                                {currentAttachment.mimetype?.startsWith('image/') && (
                                                    <Box borderRadius="md" overflow="hidden" border="1px" borderColor="gray.200">
                                                        <Image
                                                            src={`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/${currentAttachment.path.replace(/\\/g, '/')}`}
                                                            alt="Current attachment"
                                                            maxH="200px"
                                                            objectFit="contain"
                                                            mx="auto"
                                                        />
                                                    </Box>
                                                )}
                                            </VStack>
                                        </Box>
                                    )}

                                    {previewUrl && (
                                        <Box mb={4} p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.100">
                                            <Heading size="xs" mb={2} color="blue.700">New File Preview:</Heading>
                                            <Box borderRadius="md" overflow="hidden" border="1px" borderColor="blue.200" bg="white">
                                                <Image
                                                    src={previewUrl}
                                                    alt="New attachment preview"
                                                    maxH="200px"
                                                    objectFit="contain"
                                                    mx="auto"
                                                />
                                            </Box>
                                        </Box>
                                    )}

                                    <Input
                                        name="attachment"
                                        label={currentAttachment ? "Change File (Optional)" : "Upload File (Optional)"}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp4"
                                        sx={{ padding: 1 }}
                                        value={undefined}
                                        onChange={(event) => {
                                            const file = event.currentTarget.files[0];
                                            setFieldValue("attachment", file);

                                            // Handle preview
                                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                                            if (file && file.type.startsWith('image/')) {
                                                setPreviewUrl(URL.createObjectURL(file));
                                                setIsFileRemoved(false);
                                            } else {
                                                setPreviewUrl(null);
                                                if (file) setIsFileRemoved(false);
                                            }
                                        }}
                                    />
                                </Box>

                                <HStack spacing={4} mt={4}>
                                    <Button type="submit" isLoading={isSubmitting}>
                                        Update Task
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate(ROUTES.TASKS)}
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
