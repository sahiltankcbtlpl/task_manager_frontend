import { Box, Heading, useToast, Center, Spinner } from '@chakra-ui/react';
import TaskStatusForm from './TaskStatusForm';
import { getTaskStatusById, updateTaskStatus } from '../../api/taskStatus.api';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';
import { useState, useEffect } from 'react';

const EditTaskStatus = () => {
    const { id } = useParams();
    const toast = useToast();
    const navigate = useNavigate();
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getTaskStatusById(id);
                setInitialValues({
                    name: data.name,
                    status: data.status,
                });
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to delete',
                    status: 'error',
                });
                navigate(ROUTES.TASK_STATUS);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [id, navigate, toast]);

    const handleSubmit = async (values, actions) => {
        try {
            await updateTaskStatus(id, values);
            toast({
                title: 'Status Updated',
                status: 'success',
                duration: 3000,
            });
            navigate(ROUTES.TASK_STATUS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update status',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    if (loading) return <Center h="200px"><Spinner /></Center>;

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Edit Task Status</Heading>
            <TaskStatusForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                isEdit
            />
        </Box>
    );
};

export default EditTaskStatus;
