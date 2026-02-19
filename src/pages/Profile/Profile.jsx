import React, { useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Avatar,
    Badge,
    Card,
    CardHeader,
    CardBody,
    Divider,
    useColorModeValue,
    Spinner,
    Center
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { user, checkSession, isLoading } = useAuth();

    // Fetch latest user data when component mounts
    useEffect(() => {
        checkSession();
    }, []);

    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    if (isLoading && !user) {
        return (
            <Center h="500px">
                <Spinner size="xl" />
            </Center>
        );
    }

    if (!user) {
        return <Text color="red.500">Could not load profile data.</Text>;
    }

    return (
        <Box maxW="800px" mx="auto" pt={10}>
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" shadow="md" borderRadius="lg">
                <CardHeader>
                    <HStack spacing={6} align="center">
                        <Avatar
                            size="2xl"
                            name={user.name}
                            bg="blue.500"
                            color="white"
                        />
                        <VStack align="start" spacing={1}>
                            <Heading size="lg">{user.name}</Heading>
                            <Badge colorScheme="blue" fontSize="0.9em" px={2} py={1} borderRadius="md">
                                {user.role || 'No Role'}
                            </Badge>
                        </VStack>
                    </HStack>
                </CardHeader>

                <Divider />

                <CardBody>
                    <VStack align="start" spacing={5}>
                        <Box w="100%">
                            <Text fontSize="sm" color="gray.500" mb={1}>Email Address</Text>
                            <Text fontSize="md" fontWeight="medium">{user.email}</Text>
                        </Box>

                        <Box w="100%">
                            <Text fontSize="sm" color="gray.500" mb={1}>Phone Number</Text>
                            <Text fontSize="md" fontWeight="medium">{user.phone || 'N/A'}</Text>
                        </Box>

                        <Box w="100%">
                            <Text fontSize="sm" color="gray.500" mb={1}>User ID</Text>
                            <Text fontSize="xs" fontFamily="monospace" bg="gray.100" p={1} borderRadius="sm">
                                {user._id}
                            </Text>
                        </Box>

                        <Box w="100%">
                            <Text fontSize="sm" color="gray.500" mb={2}>Permissions</Text>
                            <HStack spacing={2} wrap="wrap">
                                {user.permissions && user.permissions.length > 0 ? (
                                    user.permissions.map((perm) => (
                                        <Badge key={perm._id || perm} colorScheme="green" variant="subtle">
                                            {perm.name || perm}
                                        </Badge>
                                    ))
                                ) : (
                                    <Text fontSize="sm" color="gray.400">No specific permissions assigned.</Text>
                                )}
                            </HStack>
                        </Box>
                    </VStack>
                </CardBody>
            </Card>
        </Box>
    );
};

export default Profile;
