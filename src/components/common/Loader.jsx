import { Center, Spinner, Box, Skeleton, Stack, SimpleGrid, Flex } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const Loader = ({ size = 'xl', type = 'spinner', ...props }) => {

    if (type === 'table') {
        return (
            <Box w="100%" bg="white" p={4} shadow="sm" borderRadius="md" {...props}>
                <Stack spacing={4}>
                    <Skeleton height="40px" />
                    <Skeleton height="20px" />
                    <Skeleton height="20px" />
                    <Skeleton height="20px" />
                    <Skeleton height="20px" />
                    <Skeleton height="20px" />
                </Stack>
            </Box>
        );
    }

    if (type === 'card') {
        return (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="100%" {...props}>
                {[1, 2, 3].map((i) => (
                    <Box key={i} p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
                        <Skeleton height="20px" mb={4} width="40%" />
                        <Skeleton height="40px" mb={2} width="80%" />
                        <Skeleton height="15px" width="60%" />
                    </Box>
                ))}
            </SimpleGrid>
        );
    }

    if (type === 'list') {
        return (
            <Stack spacing={4} w="100%" {...props}>
                {[1, 2, 3, 4].map((i) => (
                    <Box key={i} p={4} shadow="sm" borderWidth="1px" borderRadius="md" bg="white">
                        <Flex justify="space-between">
                            <Box w="60%">
                                <Skeleton height="20px" mb={2} />
                                <Skeleton height="15px" w="70%" />
                            </Box>
                            <Skeleton height="30px" w="80px" borderRadius="full" />
                        </Flex>
                    </Box>
                ))}
            </Stack>
        );
    }

    if (type === 'default') {
        return (
            <Stack spacing={4} w="100%" {...props}>
                <Skeleton height="20px" />
                <Skeleton height="20px" />
                <Skeleton height="20px" />
            </Stack>
        );
    }

    // Default to existing spinner
    return (
        <Center w="100%" h="100%" minH="200px" {...props}>
            <Spinner size={size} color="brand.500" thickness="4px" speed="0.65s" emptyColor="gray.200" />
        </Center>
    );
};

Loader.propTypes = {
    size: PropTypes.string,
    type: PropTypes.oneOf(['spinner', 'table', 'card', 'list', 'default'])
};

export default Loader;
