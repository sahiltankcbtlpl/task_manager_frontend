import { Box, Heading, VStack, HStack, useToast, Spinner, Center } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { updatePermission, getPermissions } from '../../api/permission.api';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';
import { useState, useEffect } from 'react';
import api from '../../api/axios'; // Direct axios for single fetch if getPermissionById not in api file

const EditPermissionSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    value: Yup.string().required('Required').matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
    status: Yup.string().required('Required'),
});

const EditPermission = () => {
    const { id } = useParams();
    const toast = useToast();
    const navigate = useNavigate();
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermission = async () => {
            try {
                // Assuming we don't have a single getPermission endpoint exposed publicly in api.js yet, 
                // but we can fetch list or use direct call. 
                // Ideally backend should support /api/permissions/:id GET.
                // Let's assume filtering from list for now if getById isn't confirmed, 
                // OR better, trust backend standard routes.
                // Checking backend routes... yes, GET /:id is not explicitly in permissionRoutes.js in the view_file output previously 
                // Wait, let me check the previous view_file of permissionRoutes.js.
                // It showed: router.route('/:id').put(...).delete(...)
                // It did NOT show .get() for /:id.
                // So I need to fetch all and filter, or add .get() to backend.
                // For now, I will fetch all and filter to avoid backend changes if not requested, 
                // OR since I am Super Admin developer, I should probably add the GET route.
                // BUT, to be safe and quick, fetching all is fine for permissions as there aren't millions.

                const data = await getPermissions();
                const perm = data.find(p => p._id === id);

                if (perm) {
                    setInitialValues({
                        name: perm.name,
                        value: perm.value,
                        status: perm.status.toLowerCase()
                    });
                } else {
                    toast({ title: 'Error', description: 'Permission not found', status: 'error' });
                    navigate(ROUTES.PERMISSIONS);
                }
            } catch (error) {
                console.error(error);
                toast({ title: 'Error', description: 'Failed to load permission', status: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchPermission();
    }, [id, navigate, toast]);

    const handleSubmit = async (values, actions) => {
        try {
            await updatePermission(id, values);
            toast({
                title: 'Permission Updated',
                status: 'success',
                duration: 3000,
            });
            navigate(ROUTES.PERMISSIONS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update permission',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    if (loading) return <Center h="200px"><Spinner size="xl" /></Center>;

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Edit Permission</Heading>

            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={initialValues}
                    validationSchema={EditPermissionSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, setFieldValue, handleChange }) => (
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
                                        { label: 'Active', value: 'active' },
                                        { label: 'Inactive', value: 'inactive' }
                                    ]}
                                />
                                <HStack spacing={4} mt={4}>
                                    <Button type="submit" isLoading={isSubmitting}>
                                        Update
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

export default EditPermission;
