import { FormControl, FormLabel, Select as ChakraSelect, FormErrorMessage } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { useField } from 'formik';

const Select = ({ label, options, helperText, ...props }) => {
    const [field, meta] = useField(props);
    return (
        <FormControl isInvalid={meta.touched && meta.error}>
            <FormLabel htmlFor={props.id || props.name}>{label}</FormLabel>
            <ChakraSelect {...field} {...props}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </ChakraSelect>
            <FormErrorMessage>{meta.error}</FormErrorMessage>
        </FormControl>
    );
};

Select.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
    id: PropTypes.string,
    helperText: PropTypes.string,
};

export default Select;
