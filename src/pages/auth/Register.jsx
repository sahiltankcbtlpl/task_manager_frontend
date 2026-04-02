import { Box, Button, Container, Heading, VStack, useToast, Text, Divider, SimpleGrid } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

const RegisterSchema = Yup.object().shape({
    companyName: Yup.string().required('Required'),
    companyEmail: Yup.string().email('Invalid email').required('Required'),
    companyAddress: Yup.string(),
    gstNo: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format (Optional)').nullable(),
    name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    phone: Yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits').required('Required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required'),
});

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (values, actions) => {
        try {
            await register(values);
            toast({
                title: 'Registration Successful',
                description: 'Company and user account created.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate(ROUTES.DASHBOARD);
        } catch (error) {
            toast({
                title: 'Registration Failed',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            actions.setSubmitting(false);
        }
    };

    return (
        <Container maxW="container.md" py={10}>
            <Box p={8} bg="white" borderRadius="lg" boxShadow="lg">
                <VStack spacing={6} align="stretch">
                    <Heading textAlign="center" size="lg" color="brand.600">Create New Account</Heading>
                    <Text textAlign="center" color="gray.500" fontSize="sm">Join us and start managing your tasks efficiently</Text>

                    <Formik
                        initialValues={{
                            companyName: '',
                            companyEmail: '',
                            companyAddress: '',
                            gstNo: '',
                            name: '',
                            email: '',
                            phone: '',
                            password: '',
                        }}
                        validationSchema={RegisterSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <VStack spacing={8} align="stretch">
                                    <Box>
                                        <Heading size="md" mb={4} color="gray.700">Company Details</Heading>
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                            <Input name="companyName" label="Company Name" placeholder="Enter company name" />
                                            <Input name="companyEmail" label="Company Email" placeholder="Enter company email" />
                                            <Input name="companyAddress" label="Address" placeholder="Enter address" />
                                            <Input name="gstNo" label="GST Number" placeholder="15-digit GST (Optional)" />
                                        </SimpleGrid>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Heading size="md" mb={4} color="gray.700">Owner Details</Heading>
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                            <Input name="name" label="Full Name" placeholder="Enter your name" />
                                            <Input name="email" label="Personal/Work Email" placeholder="Enter your email" />
                                            <Input name="phone" label="Phone Number" placeholder="10-digit phone" />
                                            <Input name="password" label="Password" type="password" placeholder="Min 6 characters" />
                                        </SimpleGrid>
                                    </Box>

                                    <Button type="submit" w="full" colorScheme="brand" size="lg" isLoading={isSubmitting}>
                                        Register Company
                                    </Button>

                                    <Text color="gray.600" fontSize="sm" textAlign="center">
                                        Already have an account?{' '}
                                        <Box as={RouterLink} to={ROUTES.LOGIN} display="inline" color="brand.500" fontWeight="semibold">
                                            Sign In
                                        </Box>
                                    </Text>
                                </VStack>
                            </Form>
                        )}
                    </Formik>
                </VStack>
            </Box>
        </Container>
    );
};

export default Register;
