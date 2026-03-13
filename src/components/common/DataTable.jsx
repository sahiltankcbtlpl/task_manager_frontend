import React from 'react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Box,
    Spinner,
    Center,
    Text,
    Skeleton,
} from '@chakra-ui/react';
import PropTypes from 'prop-types';

const DataTable = ({ columns, data, isLoading, emptyMessage = "No data found", pagination }) => {
    return (
        <Box>
            <Box bg="white" shadow="md" borderRadius="lg" overflowX="auto">
                <Table variant="simple">
                    <Thead bg="gray.50">
                        <Tr>
                            {columns.map((col, index) => (
                                <Th key={index}>{col.header}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {isLoading ? (
                            // Render skeleton rows when loading
                            Array.from({ length: Math.max(1, pagination?.pageSize || 5) }).map((_, rowIndex) => (
                                <Tr key={`skeleton-${rowIndex}`}>
                                    {columns.map((_, colIndex) => (
                                        <Td key={`skeleton-${rowIndex}-${colIndex}`}>
                                            <Skeleton height="20px" borderRadius="md" w={colIndex === 0 ? "80%" : "60%"} />
                                        </Td>
                                    ))}
                                </Tr>
                            ))
                        ) : data && data.length > 0 ? (
                            // Render actual data rows
                            data.map((row, rowIndex) => (
                                <Tr key={row._id || rowIndex}>
                                    {columns.map((col, colIndex) => (
                                        <Td key={`${rowIndex}-${colIndex}`}>
                                            {col.render
                                                ? col.render(row)
                                                : row[col.accessor]}
                                        </Td>
                                    ))}
                                </Tr>
                            ))
                        ) : (
                            // Empty state within the table body (fallback if outer !data condition didn't catch it)
                            <Tr>
                                <Td colSpan={columns.length} textAlign="center">
                                    <Text color="gray.500">{emptyMessage}</Text>
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>
            {pagination && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.onPageChange}
                    pageSize={pagination.pageSize}
                    onPageSizeChange={pagination.onPageSizeChange}
                    totalItems={pagination.totalItems}
                />
            )}
        </Box>
    );
};

import Pagination from './Pagination';

DataTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            header: PropTypes.string.isRequired,
            accessor: PropTypes.string,
            render: PropTypes.func,
        })
    ).isRequired,
    data: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    emptyMessage: PropTypes.string,
    pagination: PropTypes.shape({
        currentPage: PropTypes.number,
        totalPages: PropTypes.number,
        onPageChange: PropTypes.func,
        pageSize: PropTypes.number,
        onPageSizeChange: PropTypes.func,
        totalItems: PropTypes.number,
    }),
};

export default DataTable;
