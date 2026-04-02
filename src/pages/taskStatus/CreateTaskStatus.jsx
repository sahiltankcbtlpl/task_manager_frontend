import { Box, Heading, useToast } from '@chakra-ui/react';
import TaskStatusForm from './TaskStatusForm';
import { createTaskStatus } from '../../api/taskStatus.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

import { useProject } from '../../context/ProjectContext';

const CreateTaskStatus = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const { activeProjectId } = useProject();

    const handleSubmit = async (values, actions) => {
        if (!activeProjectId) {
            toast({
                title: 'No Project Selected',
                description: 'Please select a project before creating a status.',
                status: 'error',
                duration: 3000,
            });
            actions.setSubmitting(false);
            return;
        }

        try {
            await createTaskStatus({ ...values, project: activeProjectId });
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
