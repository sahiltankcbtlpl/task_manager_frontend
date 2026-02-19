import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    useToast,
    InputGroup,
    InputLeftAddon,
    FormErrorMessage,
    Spinner,
    Center
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import useAuth from '../../hooks/useAuth';
import { updateProfile, checkSession } from '../../api/auth.api';

const ProfileModal = ({ isOpen, onClose }) => {
    const { updateUser } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

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
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // Ensure we don't send role or email if they are supposed to be read-only (though backend should handle it)
                const payload = {
                    name: values.name,
                    phone: values.phone
                };

                const updatedUser = await updateProfile(payload);
                updateUser(updatedUser); // Update context
                toast({
                    title: 'Profile Updated',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onClose();
            } catch (error) {
                toast({
                    title: 'Update failed',
                    description: error.response?.data?.message || 'Could not update profile',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Fetch fresh data when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const userData = await checkSession(); // Fetch fresh "me" data
                    formik.setValues({
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        role: userData.role || '', // Assuming role name is returned directly or as object
                    });
                } catch (error) {
                    toast({
                        title: 'Error',
                        description: 'Could not fetch profile details',
                        status: 'error',
                    });
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Profile</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={formik.handleSubmit}>
                    <ModalBody>
                        {loading ? (
                            <Center p={4}><Spinner /></Center>
                        ) : (
                            <VStack spacing={4}>
                                <FormControl isInvalid={formik.touched.name && formik.errors.name}>
                                    <FormLabel>Full Name</FormLabel>
                                    <Input
                                        name="name"
                                        placeholder="Your Name"
                                        {...formik.getFieldProps('name')}
                                    />
                                    <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Role</FormLabel>
                                    <Input
                                        name="role"
                                        value={formik.values.role}
                                        isReadOnly
                                        bg="gray.100"
                                        border="none"
                                        _focus={{ boxShadow: 'none' }}
                                    />
                                </FormControl>

                                <FormControl isInvalid={formik.touched.email && formik.errors.email}>
                                    <FormLabel>Email Address</FormLabel>
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        {...formik.getFieldProps('email')}
                                        isReadOnly
                                        bg="gray.100"
                                        _focus={{ boxShadow: 'none' }}
                                    />
                                    <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={formik.touched.phone && formik.errors.phone}>
                                    <FormLabel>Phone Number</FormLabel>
                                    <InputGroup>
                                        <InputLeftAddon children="+91" />
                                        <Input
                                            name="phone"
                                            type="tel"
                                            placeholder="9876543210"
                                            {...formik.getFieldProps('phone')}
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>{formik.errors.phone}</FormErrorMessage>
                                </FormControl>
                            </VStack>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            isLoading={formik.isSubmitting}
                            isDisabled={loading}
                        >
                            Save Changes
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default ProfileModal;
