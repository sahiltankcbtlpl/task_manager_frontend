import { Select, Spinner } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const TableSelect = ({ value, options, onChange, isDisabled, placeholder, isLoading }) => {
    return (
        <div onClick={(e) => e.stopPropagation()}>
            {isLoading ? (
                <Spinner size="sm" />
            ) : (
                <Select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    isDisabled={isDisabled}
                    placeholder={placeholder}
                    size="sm"
                    variant="outline"
                    bg="white"
                    borderRadius="lg"
                    borderColor="gray.100"
                    shadow="xs"
                    fontWeight="medium"
                    _hover={{ borderColor: 'brand.200', shadow: 'sm' }}
                    _focus={{ 
                        borderColor: 'brand.500', 
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' 
                    }}
                    transition="all 0.2s"
                    iconColor="brand.400"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            )}
        </div>
    );
};

TableSelect.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    placeholder: PropTypes.string,
    isLoading: PropTypes.bool,
};

export default TableSelect;
