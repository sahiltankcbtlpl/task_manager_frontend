import { Box, Heading, Text, Icon, VStack } from '@chakra-ui/react';
import { FiInbox } from 'react-icons/fi';
import PropTypes from 'prop-types';

const EmptyState = ({ title = 'No Data', description = 'There is nothing here yet.', icon = FiInbox }) => {
    return (
        <VStack spacing={4} py={10} px={6} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
            <Icon as={icon} boxSize={10} color="gray.400" />
            <Box>
                <Heading size="md" mb={1} color="gray.600">{title}</Heading>
                <Text color="gray.500">{description}</Text>
            </Box>
        </VStack>
    );
};

EmptyState.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.elementType,
};

export default EmptyState;
