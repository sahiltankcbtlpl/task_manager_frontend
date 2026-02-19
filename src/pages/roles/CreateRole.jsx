import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import RoleForm from './RoleForm';
import { createRole } from '../../api/role.api';
import { ROUTES } from '../../config/routes.config';

const CreateRole = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (values, actions) => {
        try {
            await createRole(values);
            toast({ title: 'Role Created', status: 'success' });
            navigate(ROUTES.ROLES);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create role',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <RoleForm
            title="Create New Role"
            initialValues={{ name: '', status: 'Active', permissions: [] }}
            onSubmit={handleSubmit}
        />
    );
};

export default CreateRole;
