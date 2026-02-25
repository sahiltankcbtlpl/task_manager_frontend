import { Box, Heading, useToast } from '@chakra-ui/react';
import TaskStatusForm from './TaskStatusForm';
import { createTaskStatus } from '../../api/taskStatus.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

const CreateTaskStatus = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (values, actions) => {
        try {
            await createTaskStatus(values);
            toast({
                title: 'Status Created',
                status: 'success',
                duration: 3000,
            });
            navigate(ROUTES.TASK_STATUS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create status',
                status: 'error',
                duration: 3000,
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Create Task Status</Heading>
            <TaskStatusForm
                initialValues={{ name: '', status: 'active' }}
                onSubmit={handleSubmit}
            />
        </Box>
    );
};

export default CreateTaskStatus;
