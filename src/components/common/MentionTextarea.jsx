import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    Textarea as ChakraTextarea,
    Box,
    List,
    ListItem,
    Text,
    Avatar,
    HStack,
    Portal
} from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { useField } from 'formik';
import { getStaffList } from '../../api/user.api';
import useAuth from '../../hooks/useAuth';

// --- Base MentionTextarea Component ---
export const MentionTextarea = ({ label, value, onChange, placeholder, ...props }) => {
    const textareaRef = useRef(null);
    const [showUsers, setShowUsers] = useState(false);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Track where the @ was typed
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const { user: currentUser } = useAuth();

    const fetchUsers = useCallback(async () => {
        try {
            const response = await getStaffList({});
            const staff = response.data || response; // Adjust based on actual API response structure

            let fetchedUsers = Array.isArray(staff) ? staff : [];
            // Filter out current user
            if (currentUser && currentUser._id) {
                fetchedUsers = fetchedUsers.filter(u => u._id !== currentUser._id);
            }
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Failed to fetch users for mentions:', error);
            setUsers([]);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // calculate coords for the popover using a hidden div technique
    const updateMenuPosition = () => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();

        // Simple positioning relative to the textarea itself
        // A more advanced approach involves computing coordinates of the exact text character
        // Here we just place it below the textarea for simplicity and robustness

        setMenuPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
        });
    };

    useEffect(() => {
        if (showUsers) {
            updateMenuPosition();
            window.addEventListener('resize', updateMenuPosition);
            window.addEventListener('scroll', updateMenuPosition);
            return () => {
                window.removeEventListener('resize', updateMenuPosition);
                window.removeEventListener('scroll', updateMenuPosition);
            };
        }
    }, [showUsers]);


    const handleChange = (e) => {
        const newValue = e.target.value;
        const currentCursor = e.target.selectionStart;

        // Call external plain onChange
        onChange(e);

        // Check for mentions
        const textBeforeCursor = newValue.slice(0, currentCursor);
        const match = textBeforeCursor.match(/@([\w]*)$/);

        if (match) {
            const query = match[1].toLowerCase();
            setMentionStartIndex(match.index);
            setMentionQuery(query);

            const filtered = users.filter(user => {
                const isMatchQuery = user.name.toLowerCase().includes(query) ||
                    (user.email && user.email.toLowerCase().includes(query));
                // Optimization: don't show user if they are already mentioned elsewhere in the text
                const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`@${escapeRegex(user.name)}\\b`, 'i');
                const isAlreadyMentioned = regex.test(newValue);

                return isMatchQuery && !isAlreadyMentioned;
            });

            setFilteredUsers(filtered);
            setShowUsers(true);
            setSelectedIndex(0);
        } else {
            setShowUsers(false);
        }
    };

    const insertMention = (user) => {
        if (mentionStartIndex === -1 || !textareaRef.current) return;

        const textBeforeMention = value.slice(0, mentionStartIndex);
        const textAfterMention = value.slice(textareaRef.current.selectionStart);

        const mentionText = `@${user.name} `;
        const newValue = `${textBeforeMention}${mentionText}${textAfterMention}`;

        // Mock an event to pass to standard onChange handlers
        const syntheticEvent = {
            target: {
                name: props.name || props.id,
                value: newValue
            }
        };

        onChange(syntheticEvent);
        setShowUsers(false);

        // Restore focus and cursor position
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = mentionStartIndex + mentionText.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 10);
    };

    const handleKeyDown = (e) => {
        if (showUsers) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredUsers.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (filteredUsers[selectedIndex]) {
                    insertMention(filteredUsers[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                setShowUsers(false);
            }
        }
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showUsers && textareaRef.current && !textareaRef.current.contains(e.target)) {
                // adding a small delay to allow list item click to fire first
                setTimeout(() => setShowUsers(false), 200);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUsers]);

    return (
        <FormControl>
            {label && <FormLabel htmlFor={props.id || props.name}>{label}</FormLabel>}
            <Box position="relative">
                <ChakraTextarea
                    ref={textareaRef}
                    value={value || ''}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    {...props}
                />
            </Box>

            {showUsers && filteredUsers.length > 0 && (
                <Portal>
                    <Box
                        position="absolute"
                        top={`${menuPosition.top}px`}
                        left={`${menuPosition.left}px`}
                        width={`${menuPosition.width}px`}
                        maxHeight="200px"
                        overflowY="auto"
                        bg="white"
                        boxShadow="lg"
                        borderRadius="md"
                        zIndex={1400}
                        mt={1}
                        border="1px solid"
                        borderColor="gray.200"
                    >
                        <List spacing={0}>
                            {filteredUsers.map((user, index) => (
                                <ListItem
                                    key={user._id || index}
                                    px={4}
                                    py={3}
                                    cursor="pointer"
                                    bg={index === selectedIndex ? 'blue.50' : 'transparent'}
                                    _hover={{ bg: 'gray.50' }}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                    _last={{ borderBottom: 'none' }}
                                    onClick={() => insertMention(user)}
                                >
                                    <HStack>
                                        <Avatar size="sm" name={user.name} src={user.avatar} bg="brand.500" color="white" />
                                        <Box ml={2}>
                                            <Text fontSize="sm" fontWeight="bold" color="gray.800">{user.name}</Text>
                                            <Text fontSize="xs" color="gray.400" textTransform="uppercase">
                                                {user.role?.name || user.role || 'STAFF'}
                                            </Text>
                                        </Box>
                                    </HStack>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Portal>
            )}
        </FormControl>
    );
};

MentionTextarea.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string
};

// --- Formik Wrapper Component ---
export const FormikMentionTextarea = ({ label, ...props }) => {
    const [field, meta, helpers] = useField(props);

    const handleChange = (e) => {
        helpers.setValue(e.target.value);
    };

    return (
        <FormControl isInvalid={meta.touched && meta.error}>
            <MentionTextarea
                {...field}
                {...props}
                label={label}
                value={field.value}
                onChange={handleChange}
            />
            {meta.error && <FormErrorMessage>{meta.error}</FormErrorMessage>}
        </FormControl>
    );
};

FormikMentionTextarea.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
};

export default MentionTextarea;
