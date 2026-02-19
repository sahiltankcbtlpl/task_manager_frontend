import { Box, VStack, HStack, useToast } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

const TaskStatusSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    status: Yup.string().required('Required'),
});

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Deleted', value: 'deleted' },
];

const TaskStatusForm = ({ initialValues, onSubmit, isEdit = false }) => {
    const navigate = useNavigate();

    return (
        <Box p={8} bg="white" borderRadius="md" shadow="sm">
            <Formik
                initialValues={initialValues}
                validationSchema={TaskStatusSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ isSubmitting }) => (
                    <Form>
                        <VStack spacing={4} align="stretch">
                            <Input
                                name="name"
                                label="Status Name"
                                placeholder="e.g. Code Review"
                            />
                            <Select
                                name="status"
                                label="Status"
                                placeholder="Select status"
                                options={STATUS_OPTIONS}
                                helperText="Set status as Active or Inactive."
                            />

                            <HStack spacing={4} mt={4}>
                                <Button type="submit" isLoading={isSubmitting}>
                                    {isEdit ? 'Update Status' : 'Create Status'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate(ROUTES.TASK_STATUS)}
                                >
                                    Cancel
                                </Button>
                            </HStack>
                        </VStack>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default TaskStatusForm;
