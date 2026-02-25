import {
    Box,
    Heading,
    VStack,
    useToast,
    HStack,
    Image,
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
        attachment: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

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
                if (value) formData.append(key, value);
            });

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
                    {({ isSubmitting, setFieldValue }) => (
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
                                    {previewUrl && (
                                        <Box mb={4} p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.100">
                                            <Heading size="xs" mb={2} color="blue.700">File Preview:</Heading>
                                            <Box borderRadius="md" overflow="hidden" border="1px" borderColor="blue.200" bg="white">
                                                <Image
                                                    src={previewUrl}
                                                    alt="Attachment preview"
                                                    maxH="200px"
                                                    objectFit="contain"
                                                    mx="auto"
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                    <Input
                                        name="attachment"
                                        label="Attachment (Optional)"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp4"
                                        value={undefined}
                                        onChange={e => {
                                            const file = e.currentTarget.files[0];
                                            setFieldValue('attachment', file);

                                            // Handle preview
                                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                                            if (file && file.type.startsWith('image/')) {
                                                setPreviewUrl(URL.createObjectURL(file));
                                            } else {
                                                setPreviewUrl(null);
                                            }
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