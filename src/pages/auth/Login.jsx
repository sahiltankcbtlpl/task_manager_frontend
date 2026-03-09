import { Box, Button, Container, Heading, VStack, useToast, Text } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().required('Required'),
});

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    // Parse target dynamically
    const queryParams = new URLSearchParams(location.search);
    const redirectParam = queryParams.get('redirect');
    const fromPath = redirectParam ? `/${redirectParam}` : ROUTES.DASHBOARD;

    // location.state.from is set by ProtectedRoute if the user came from a deep link while unauthenticated
    const stateFromPath = location.state?.from ? (location.state.from.pathname + location.state.from.search) : null;
    const from = stateFromPath || fromPath || ROUTES.DASHBOARD;

    const handleSubmit = async (values, actions) => {
        try {
            await login(values.email, values.password);
            toast({
                title: 'Login Successful',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate(from, { replace: true });
        } catch (error) {
            toast({
                title: 'Login Failed',
                description: error.response?.data?.message || 'Invalid credentials',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            actions.setSubmitting(false);
        }
    };

    return (
        <Container maxW="container.xl" h="100vh" centerContent justifyContent="center" bg="gray.50">
            <Box p={8} bg="white" borderRadius="lg" boxShadow="lg" w="100%" maxW="md">
                <VStack spacing={6} align="stretch">
                    <Heading textAlign="center" size="lg" color="brand.600">Welcome Back</Heading>
                    <Text textAlign="center" color="gray.500" fontSize="sm">Please sign in to continue</Text>

                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={LoginSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <VStack spacing={4}>
                                    <Input name="email" label="Email Address" placeholder="Enter your email" />
                                    <Input name="password" label="Password" type="password" placeholder="Enter your password" />

                                    <Button type="submit" w="full" isLoading={isSubmitting} mt={4}>
                                        Sign In
                                    </Button>
                                </VStack>
                            </Form>
                        )}
                    </Formik>
                </VStack>
            </Box>
        </Container>
    );
};

export default Login;
