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
                    borderColor="gray.200"
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                    iconColor="gray.400"
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
