import React from 'react';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import PropTypes from 'prop-types';

const SearchBar = ({ placeholder, value, onChange, ...props }) => {
    return (
        <InputGroup maxW="300px" {...props}>
            <InputLeftElement pointerEvents="none" h="full">
                <FiSearch color="gray.400" />
            </InputLeftElement>
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                bg="white"
                h="45px"
                shadow="soft"
                borderRadius="xl"
                border="1px"
                borderColor="gray.100"
                _placeholder={{ color: 'gray.400', fontSize: 'sm' }}
                _focus={{ borderColor: 'brand.500', shadow: 'md' }}
            />
        </InputGroup>
    );
};

SearchBar.propTypes = {
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

SearchBar.defaultProps = {
    placeholder: 'Search...',
};

export default SearchBar;
