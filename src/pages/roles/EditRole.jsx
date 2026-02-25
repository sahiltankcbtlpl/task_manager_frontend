import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast, Spinner, Center } from '@chakra-ui/react';
import RoleForm from './RoleForm';
import { getRoleById, updateRole } from '../../api/role.api';
import { ROUTES } from '../../config/routes.config';

const EditRole = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const role = await getRoleById(id);
                setInitialValues({
                    name: role.name,
                    status: role.status,
                    permissions: role.permissions, // Assuming populated permissions
                });
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to load role', status: 'error', duration: 3000 });
                navigate(ROUTES.ROLES);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, [id, navigate, toast]);

    const handleSubmit = async (values, actions) => {
        try {
            await updateRole(id, values);
            toast({ title: 'Role Updated', status: 'success', duration: 3000 });
            navigate(ROUTES.ROLES);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update role',
                status: 'error',
                duration: 3000,
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    if (loading) return <Center h="200px"><Spinner size="xl" /></Center>;

    return (
        <RoleForm
            title="Edit Role"
            initialValues={initialValues}
            onSubmit={handleSubmit}
        />
    );
};

export default EditRole;
