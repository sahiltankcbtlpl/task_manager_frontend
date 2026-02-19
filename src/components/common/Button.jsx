import { Button as ChakraButton } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const Button = ({ children, isLoading, ...props }) => {
    return (
        <ChakraButton
            isLoading={isLoading}
            loadingText="Loading..."
            {...props}
        >
            {children}
        </ChakraButton>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    isLoading: PropTypes.bool,
};

export default Button;
