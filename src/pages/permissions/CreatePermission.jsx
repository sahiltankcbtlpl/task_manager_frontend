import { Box, Heading, VStack, HStack, useToast } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { createPermission } from '../../api/permission.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

const CreatePermissionSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    value: Yup.string().required('Required').matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
    status: Yup.string().required('Required'),
});

const CreatePermission = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (values, actions) => {
        try {
            await createPermission(values);
            toast({
                title: 'Permission Created',
                status: 'success',
                duration: 3000,
            });
            navigate(ROUTES.PERMISSIONS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create permission',
                status: 'error',
                duration: 3000,
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Create Permission</Heading>

            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={{ name: '', value: '', status: 'Active' }}
                    validationSchema={CreatePermissionSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, setFieldValue }) => (
                        <Form>
                            <VStack spacing={4} align="stretch">
                                <Input
                                    name="name"
                                    label="Name"
                                    placeholder="e.g. Manage Tasks"
                                    onChange={(e) => {
                                        setFieldValue('name', e.target.value);
                                        const value = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
                                        setFieldValue('value', value);
                                    }}
                                />
                                <Input name="value" label="Value" placeholder="e.g. manage_tasks" />
                                <Select
                                    name="status"
                                    label="Status"
                                    options={[
                                        { label: 'Active', value: 'Active' },
                                        { label: 'Inactive', value: 'Inactive' }
                                    ]}
                                />
                                <HStack spacing={4} mt={4}>
                                    <Button type="submit" isLoading={isSubmitting}>
                                        Create Permission
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate(ROUTES.PERMISSIONS)}
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

export default CreatePermission;
