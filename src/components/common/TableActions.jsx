import React from 'react';
import { HStack, IconButton, Tooltip } from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import CanAccess from './CanAccess'; // Adjust path if needed, assuming it's in the same folder or parent

const TableActions = ({
    onEdit, // function or string (path)
    onDelete, // function
    editPermission, // string
    deletePermission, // string
    isDeleteDisabled = false,
    item // optional item to pass to callbacks if needed
}) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        if (typeof onEdit === 'string') {
            navigate(onEdit);
        } else if (typeof onEdit === 'function') {
            onEdit(item);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(item);
        }
    };

    return (
        <HStack spacing={2}>
            {editPermission ? (
                <CanAccess permission={editPermission}>
                    <Tooltip label="Edit">
                        <IconButton
                            icon={<FiEdit2 />}
                            aria-label="Edit"
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={handleEdit}
                        />
                    </Tooltip>
                </CanAccess>
            ) : (
                <Tooltip label="Edit">
                    <IconButton
                        icon={<FiEdit2 />}
                        aria-label="Edit"
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={handleEdit}
                    />
                </Tooltip>
            )}

            {deletePermission ? (
                <CanAccess permission={deletePermission}>
                    <Tooltip label="Delete">
                        <IconButton
                            icon={<FiTrash2 />}
                            aria-label="Delete"
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={handleDelete}
                            isDisabled={isDeleteDisabled}
                        />
                    </Tooltip>
                </CanAccess>
            ) : (
                <Tooltip label="Delete">
                    <IconButton
                        icon={<FiTrash2 />}
                        aria-label="Delete"
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={handleDelete}
                        isDisabled={isDeleteDisabled}
                    />
                </Tooltip>
            )}
        </HStack>
    );
};

export default TableActions;
