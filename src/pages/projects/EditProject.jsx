import React, { useEffect, useState } from 'react';
import { Box, Heading, VStack, HStack, useToast, FormControl, FormLabel, Select as ChakraSelect } from '@chakra-ui/react';
import { Formik, Form, useField } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';

import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import UserMultiSelect from '../../components/projects/UserMultiSelect';
import { getProjectById, updateProject } from '../../api/project.api';
import { getStaffList } from '../../api/user.api';
import { ROUTES } from '../../config/routes.config';

const EditProjectSchema = Yup.object({
    title: Yup.string().required('Required'),
    description: Yup.string(),
    members: Yup.array().of(Yup.string()),
});


const EditProject = () => {
    const { id } = useParams();
    const toast = useToast();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectRes, usersRes] = await Promise.all([
                    getProjectById(id),
                    getStaffList()
                ]);

                const staffOptions = usersRes
                    .filter(u => (u.role?.name || u.role) !== 'Super Admin');
                setUsers(staffOptions);

                setInitialValues({
                    title: projectRes.title || '',
                    description: projectRes.description || '',
                    members: projectRes.members ? projectRes.members.map(m => m._id || m) : [],
                });
            } catch (error) {
                toast({ title: 'Failed to load project details', status: 'error' });
                navigate(ROUTES.PROJECTS);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, toast, navigate]);

    const handleSubmit = async (values, actions) => {
        try {
            await updateProject(id, values);
            toast({ title: 'Project Updated', status: 'success' });
            navigate(ROUTES.PROJECTS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update project',
                status: 'error',
            });
        } finally {
            actions.setSubmitting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <Box maxW="container.md" mx="auto" mt={8}>
            <Heading mb={6} size="lg">Edit Project</Heading>
            <Box p={8} bg="white" borderRadius="md" shadow="sm">
                {initialValues && (
                    <Formik
                        initialValues={initialValues}
                        enableReinitialize
                        validationSchema={EditProjectSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <VStack spacing={4} align="stretch">
                                    <Input name="title" label="Project Title" placeholder="e.g. Website Redesign" />
                                    <Input name="description" label="Description" placeholder="Project details..." />
                                    <UserMultiSelect name="members" label="Assign Team Members" users={users} />
                                    <HStack spacing={4} mt={4}>
                                        <Button type="submit" isLoading={isSubmitting}>Update Project</Button>
                                        <Button variant="ghost" onClick={() => navigate(ROUTES.PROJECTS)}>Cancel</Button>
                                    </HStack>
                                </VStack>
                            </Form>
                        )}
                    </Formik>
                )}
            </Box>
        </Box>
    );
};

export default EditProject;
