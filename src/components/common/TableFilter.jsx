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
            borderColor="gray.100"
            borderRadius="xl"
            shadow="sm"
            fontWeight="medium"
            _hover={{ borderColor: 'brand.200', shadow: 'md' }}
            _focus={{ 
                borderColor: 'brand.500', 
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                bg: 'white'
            }}
            transition="all 0.2s"
            width="auto"
            minW="180px"
            size="md"
            cursor="pointer"
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
