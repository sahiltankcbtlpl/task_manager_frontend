import React, { useEffect, useState } from 'react';
import { Box, Heading, VStack, HStack, useToast, FormControl, FormLabel, Select as ChakraSelect } from '@chakra-ui/react';
import { Formik, Form, useField } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

import Input from '../../components/common/Input';
import { FormikMentionTextarea } from '../../components/common/MentionTextarea';
import Button from '../../components/common/Button';
import UserMultiSelect from '../../components/projects/UserMultiSelect';
import { createProject } from '../../api/project.api';
import { getStaffList } from '../../api/user.api';
import { ROUTES } from '../../config/routes.config';
import { ROLES } from '../../constants/roles';

const CreateProjectSchema = Yup.object({
    title: Yup.string().required('Required'),
    description: Yup.string(),
    members: Yup.array().of(Yup.string()),
});


const CreateProject = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await getStaffList();
                // Depending on requirements, we can exclude Super Admins
                const staffOptions = res
                    .filter(u => (u.role?.name || u.role) !== 'Super Admin');
                setUsers(staffOptions);
            } catch (error) {
                toast({ title: 'Failed to load users', status: 'error' });
            }
        };
        fetchUsers();
    }, [toast]);

    const handleSubmit = async (values, actions) => {
        try {
            await createProject(values);
            toast({ title: 'Project Created', status: 'success' });
            navigate(ROUTES.PROJECTS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create project',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Create New Project</Heading>
            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                <Formik
                    initialValues={{ title: '', description: '', members: [] }}
                    validationSchema={CreateProjectSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <VStack spacing={4} align="stretch">
                                <Input name="title" label="Project Title" placeholder="e.g. Website Redesign" />
                                <FormikMentionTextarea name="description" label="Description" placeholder="Project details... Type @ to tag staff" />
                                <UserMultiSelect name="members" label="Assign Team Members" users={users} />
                                <HStack spacing={4} mt={4}>
                                    <Button type="submit" isLoading={isSubmitting}>Create Project</Button>
                                    <Button variant="ghost" onClick={() => navigate(ROUTES.PROJECTS)}>Cancel</Button>
                                </HStack>
                            </VStack>
                        </Form>
                    )}
                </Formik>
            </Box>
        </Box>
    );
};

export default CreateProject;
