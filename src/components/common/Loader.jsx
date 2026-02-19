import { Center, Spinner } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const Loader = ({ size = 'xl', ...props }) => {
    return (
        <Center w="100%" h="100%" minH="200px" {...props}>
            <Spinner size={size} color="brand.500" thickness="4px" speed="0.65s" emptyColor="gray.200" />
        </Center>
    );
};

Loader.propTypes = {
    size: PropTypes.string,
};

export default Loader;
