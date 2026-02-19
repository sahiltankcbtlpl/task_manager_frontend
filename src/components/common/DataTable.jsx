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
    Text
} from '@chakra-ui/react';
import PropTypes from 'prop-types';

const DataTable = ({ columns, data, isLoading, emptyMessage = "No data found", pagination }) => {
    if (isLoading) {
        return (
            <Center h="200px">
                <Spinner size="xl" />
            </Center>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box bg="white" shadow="md" borderRadius="lg" p={6} textAlign="center">
                <Text color="gray.500">{emptyMessage}</Text>
            </Box>
        );
    }

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
                        {data.map((row, rowIndex) => (
                            <Tr key={row._id || rowIndex}>
                                {columns.map((col, colIndex) => (
                                    <Td key={`${rowIndex}-${colIndex}`}>
                                        {col.render
                                            ? col.render(row)
                                            : row[col.accessor]}
                                    </Td>
                                ))}
                            </Tr>
                        ))}
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
