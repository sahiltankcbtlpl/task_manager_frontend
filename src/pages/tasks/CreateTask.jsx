import { Box, Heading, VStack, useToast, HStack } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { createTask } from '../../api/task.api';
import { getStaffList } from '../../api/user.api';
import { getTaskStatuses } from '../../api/taskStatus.api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';
import { ROLES } from '../../constants/roles';
import CanAccess from '../../components/common/CanAccess';

const CreateTaskSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    description: Yup.string(),
    assignee: Yup.string(), // Optional
    taskStatus: Yup.string(),
});

const CreateTask = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [initialStatus, setInitialStatus] = useState('');

    useEffect(() => {
        // Fetch users and statuses
        const fetchData = async () => {
            try {
                const [userData, statusData] = await Promise.all([
                    getStaffList(),
                    getTaskStatuses()
                ]);

                const filteredUsers = userData.filter(u => {
                    const roleName = u.role?.name || u.role;
                    return roleName !== ROLES.ADMIN;
                });
                setUsers(filteredUsers.map(u => ({ label: u.name, value: u._id })));

                const statusOptions = statusData
                    .filter(s => s.status === 'active')
                    .map(s => ({ label: s.name, value: s._id }));
                setStatuses(statusOptions);

                // Find default status (just grab the first one if available)
                if (statusOptions.length > 0) {
                    setInitialStatus(statusOptions[0].value);
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (values, actions) => {
        try {
            await createTask(values);
            toast({
                title: 'Task Created',
                status: 'success',
                duration: 3000,
            });
            navigate(ROUTES.TASKS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create task',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Create New Task</Heading>

            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={{ name: '', description: '', assignee: '', taskStatus: initialStatus, attachment: null }}
                    enableReinitialize
                    validationSchema={CreateTaskSchema}
                    onSubmit={async (values, actions) => {
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
                                description: error.response?.data?.message || 'Failed to create task',
                                status: 'error',
                            });
                        } finally {
                            actions.setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, setFieldValue }) => (
                        <Form>
                            <VStack spacing={4} align="stretch">
                                <Input name="name" label="Task Title" placeholder="e.g. Update Website" />
                                <Input name="description" label="Description" placeholder="Task details..." />

                                <Select
                                    name="taskStatus"
                                    label="Status"
                                    placeholder="Select Status"
                                    options={statuses}
                                />

                                {/* Need a way to display users dropdown. Reusing Select. */}
                                <CanAccess permission="users-read">
                                    <Select
                                        name="assignee"
                                        label="Assign To"
                                        placeholder="Select a user"
                                        options={users}
                                    />
                                </CanAccess>

                                <Box>
                                    <Heading size="sm" mb={2}>Attachment (Optional)</Heading>
                                    <Input
                                        name="attachment"
                                        label="Upload File"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.mp4"
                                        sx={{ padding: 1 }}
                                        value={undefined}
                                        onChange={(event) => {
                                            setFieldValue("attachment", event.currentTarget.files[0]);
                                        }}
                                    />
                                </Box>

                                <HStack spacing={4} mt={4}>
                                    <Button type="submit" isLoading={isSubmitting}>
                                        Create Task
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

export default CreateTask;
