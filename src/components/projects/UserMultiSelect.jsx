import React, { useState, useRef } from 'react';
import {
    Box, FormControl, FormLabel, FormErrorMessage,
    Input, InputGroup, InputLeftElement,
    List, ListItem, Flex, Avatar, Text, Tag, TagLabel, TagCloseButton,
    Wrap, WrapItem, useOutsideClick
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { useField } from 'formik';

const UserMultiSelect = ({ label, users, ...props }) => {
    const [field, meta, helpers] = useField(props.name);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useOutsideClick({
        ref: wrapperRef,
        handler: () => setIsOpen(false),
    });

    // field.value is array of user IDs
    const selectedIds = field.value || [];

    const handleSelect = (user) => {
        if (!selectedIds.includes(user._id)) {
            helpers.setValue([...selectedIds, user._id]);
        }
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleRemove = (userId) => {
        helpers.setValue(selectedIds.filter(id => id !== userId));
    };

    const filteredUsers = users.filter(u =>
        !selectedIds.includes(u._id) &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.role?.name || u.role || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <FormControl isInvalid={meta.touched && meta.error}>
            <FormLabel>{label}</FormLabel>

            <Wrap mb={selectedIds.length > 0 ? 3 : 0}>
                {selectedIds.map(id => {
                    const user = users.find(u => u._id === id);
                    if (!user) return null;
                    return (
                        <WrapItem key={id}>
                            <Tag size="lg" borderRadius="full" variant="solid" bg="blue.500" color="white">
                                <Avatar src="" name={user.name} size="xs" ml={-1} mr={2} />
                                <TagLabel>{user.name}</TagLabel>
                                <TagCloseButton onClick={() => handleRemove(id)} />
                            </Tag>
                        </WrapItem>
                    );
                })}
            </Wrap>

            <Box position="relative" ref={wrapperRef}>
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search and select members..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onClick={() => setIsOpen(true)}
                        onFocus={() => setIsOpen(true)}
                        autoComplete="off"
                        borderColor="blue.400"
                        _hover={{ borderColor: "blue.500" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                </InputGroup>

                {isOpen && (
                    <Box
                        position="absolute"
                        top="100%"
                        left={0}
                        right={0}
                        zIndex={10}
                        mt={1}
                        bg="white"
                        boxShadow="lg"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        maxH="250px"
                        overflowY="auto"
                    >
                        <List spacing={0}>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <ListItem
                                        key={user._id}
                                        p={3}
                                        cursor="pointer"
                                        _hover={{ bg: "gray.50" }}
                                        onClick={() => handleSelect(user)}
                                        borderBottom="1px solid"
                                        borderColor="gray.100"
                                        _last={{ borderBottom: "none" }}
                                    >
                                        <Flex align="center">
                                            <Avatar size="sm" name={user.name} bg="blue.600" color="white" />
                                            <Box ml={3}>
                                                <Text fontWeight="bold" fontSize="sm">{user.name}</Text>
                                                <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                                    {user.role?.name || user.role || 'USER'}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    </ListItem>
                                ))
                            ) : (
                                <ListItem p={3} textAlign="center" color="gray.500">
                                    No members found
                                </ListItem>
                            )}
                        </List>
                    </Box>
                )}
            </Box>
            <FormErrorMessage>{meta.error}</FormErrorMessage>
        </FormControl>
    );
};

export default UserMultiSelect;
