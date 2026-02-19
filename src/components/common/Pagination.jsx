import React from 'react';
import { HStack, Button, Text, IconButton, Select } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import PropTypes from 'prop-types';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    onPageSizeChange,
    totalItems
}) => {
    if (totalPages <= 1 && !totalItems) return null;

    return (
        <HStack justify="space-between" w="full" mt={4} spacing={4} wrap="wrap">
            <HStack>
                <Text fontSize="sm" color="gray.600">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </Text>
                {onPageSizeChange && (
                    <Select
                        size="sm"
                        w="70px"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        bg="white"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </Select>
                )}
            </HStack>

            <HStack>
                <IconButton
                    icon={<FiChevronLeft />}
                    isDisabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    size="sm"
                    aria-label="Previous Page"
                />

                {/* Generate page numbers */}
                {(() => {
                    const pages = [];
                    const maxPagesToShow = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                    if (endPage - startPage + 1 < maxPagesToShow) {
                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                    }

                    for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                            <Button
                                key={i}
                                size="sm"
                                variant={currentPage === i ? 'solid' : 'outline'}
                                colorScheme={currentPage === i ? 'brand' : 'gray'}
                                onClick={() => onPageChange(i)}
                            >
                                {i}
                            </Button>
                        );
                    }
                    return pages;
                })()}

                <IconButton
                    icon={<FiChevronRight />}
                    isDisabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    size="sm"
                    aria-label="Next Page"
                />
            </HStack>
        </HStack>
    );
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    pageSize: PropTypes.number,
    onPageSizeChange: PropTypes.func,
    totalItems: PropTypes.number,
};

Pagination.defaultProps = {
    pageSize: 10,
    totalItems: 0
};

export default Pagination;
