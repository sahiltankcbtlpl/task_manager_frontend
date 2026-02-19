import React from 'react';
import { Select } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const TableFilter = ({ placeholder, options, value, onChange, ...props }) => {
    return (
        <Select
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
            width="auto"
            minW="150px"
            size="md"
            {...props}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </Select>
    );
};

TableFilter.propTypes = {
    placeholder: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        })
    ).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
};

export default TableFilter;
