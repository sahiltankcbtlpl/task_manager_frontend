import { FormControl, FormLabel, Input as ChakraInput, FormErrorMessage } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { useField } from 'formik';

const Input = ({ label, ...props }) => {
    const [field, meta] = useField(props);
    return (
        <FormControl isInvalid={meta.touched && meta.error}>
            <FormLabel htmlFor={props.id || props.name}>{label}</FormLabel>
            <ChakraInput {...field} {...props} />
            <FormErrorMessage>{meta.error}</FormErrorMessage>
        </FormControl>
    );
};

Input.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string,
    type: PropTypes.string,
};

export default Input;
