import React, { useEffect, useState } from 'react';
import {
    Box,
    Heading,
    VStack,
    Button,
    FormControl,
    FormLabel,
    Input as ChakraInput,
    Select,
    useToast,
    Container,
    FormErrorMessage,
    InputGroup,
    InputLeftAddon,
    HStack
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createStaff } from '../../api/user.api';
import { getRoles } from '../../api/role.api';
import { ROUTES } from '../../config/routes.config';
import Input from '../../components/common/Input';

const CreateStaff = () => {
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await getRoles();
                setRoles(data);
            } catch (error) {
                toast({
                    title: 'Error fetching roles',
                    description: 'Could not load roles for assignment.',
                    status: 'error',
                });
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, [toast]);

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            phone: '',
            role: '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Name is required'),
            email: Yup.string().email('Invalid email').required('Email is required'),
            phone: Yup.string().matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').required('Phone number is required'),
            role: Yup.string().required('Role is required'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await createStaff(values);
                toast({
                    title: 'Staff created',
                    description: `Account created for ${values.email}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                navigate(ROUTES.STAFF);
            } catch (error) {
                toast({
                    title: 'Creation failed',
                    description: error.response?.data?.message || 'Could not create staff member',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <Container maxW="container.md" py={8}>
            <Box bg="white" p={8} borderRadius="lg" shadow="md">
                <Heading size="md" mb={6}>Create New User</Heading>

                <form onSubmit={formik.handleSubmit}>
                    <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={formik.touched.name && formik.errors.name}>
                            <FormLabel>Full Name</FormLabel>
                            <ChakraInput
                                name="name"
                                placeholder="e.g. John Doe"
                                {...formik.getFieldProps('name')}
                            />
                        </FormControl>

                        <FormControl isInvalid={formik.touched.email && formik.errors.email}>
                            <FormLabel>Email Address</FormLabel>
                            <ChakraInput
                                name="email"
                                type="email"
                                placeholder="e.g. john@example.com"
                                {...formik.getFieldProps('email')}
                            />
                        </FormControl>

                        <FormControl isInvalid={formik.touched.phone && formik.errors.phone}>
                            <FormLabel>Phone Number</FormLabel>
                            <InputGroup>
                                <InputLeftAddon children="+91" />
                                <ChakraInput
                                    name="phone"
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    {...formik.getFieldProps('phone')}
                                />
                            </InputGroup>
                            <FormErrorMessage>{formik.errors.phone}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={formik.touched.role && formik.errors.role}>
                            <FormLabel>Assign Role</FormLabel>
                            <Select
                                name="role"
                                placeholder="Select a role"
                                {...formik.getFieldProps('role')}
                            >
                                {roles.map((role) => (
                                    <option key={role._id} value={role._id}>
                                        {role.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <HStack spacing={4} mt={4}>
                            <Button
                                type="submit"
                                colorScheme="brand"
                                isLoading={formik.isSubmitting || loadingRoles}
                                loadingText="Creating..."
                            >
                                Create User
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={() => navigate(ROUTES.STAFF)}
                            >
                                Cancel
                            </Button>
                        </HStack>
                    </VStack>
                </form>
            </Box>
        </Container>
    );
};

export default CreateStaff;
