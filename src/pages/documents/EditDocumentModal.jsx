import { useState, useEffect, useRef } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, Textarea, useToast, VStack, Box, IconButton, Tooltip,
    Text, Flex
} from '@chakra-ui/react';
import { FiX, FiFileText } from 'react-icons/fi';
import { updateDocument } from '../../api/document.api';
import { useProject } from '../../context/ProjectContext';
import { getProjectMembers } from '../../api/project.api';
import Select from 'react-select';

const EditDocumentModal = ({ isOpen, onClose, onSuccess, document }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [allowedUsers, setAllowedUsers] = useState([]);
    const [file, setFile] = useState(null);
    const [removeFile, setRemoveFile] = useState(false);
    const [loading, setLoading] = useState(false);

    // Member options
    const [memberOptions, setMemberOptions] = useState([]);
    const { activeProjectId } = useProject();
    const toast = useToast();
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && document) {
            setName(document.name || '');
            setDescription(document.description || '');

            const initialAllowed =
                document.allowedUsers?.filter(
                    u => u._id !== document.owner?._id
                ).map(u => ({
                    value: u._id,
                    label: u.name
                })) || [];

            setAllowedUsers(initialAllowed);
        }
    }, [isOpen, document]);
    useEffect(() => {
        const projectIdToFetch = document?.project?._id || document?.project;

        if (isOpen && projectIdToFetch) {
            const fetchMembers = async () => {
                try {
                    const members = await getProjectMembers(projectIdToFetch);
                    const options = members.map(m => ({
                        value: m._id,
                        label: m.name
                    }));
                    setMemberOptions(options);
                } catch (error) {
                    console.error('Failed to fetch project members', error);
                }
            };

            fetchMembers();
        }
    }, [isOpen, document]);

    const handleClose = () => {
        setFile(null);
        setRemoveFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const handleRemoveSelectedFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !description) {
            toast({ title: 'Please fill all required fields', status: 'error' });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);

            if (allowedUsers.length > 0) {
                formData.append('allowedUsers', JSON.stringify(allowedUsers.map(opt => opt.value)));
            }

            if (file) {
                formData.append('file', file);
            }

            if (removeFile) {
                formData.append('removeFile', 'true');
            }

            await updateDocument(document._id, formData);
            toast({ title: 'Document updated successfully', status: 'success' });
            onSuccess();
            handleClose();
        } catch (error) {
            toast({
                title: 'Update failed',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!document) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>Edit Document</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Document Name</FormLabel>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Description</FormLabel>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Allowed Users</FormLabel>
                            <Select
                                isMulti
                                options={memberOptions}
                                value={allowedUsers}
                                onChange={setAllowedUsers}
                                placeholder="Select users (optional)"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Replace File (Optional)</FormLabel>

                            {/* Current File Display with Red X */}
                            {document?.fileName && !removeFile && (
                                <Box mb={2} position="relative" display="inline-block">
                                    <Box
                                        p={3}
                                        borderWidth={1}
                                        borderRadius="md"
                                        bg="gray.50"
                                        pr={10}
                                    >
                                        <Flex align="center">
                                            <FiFileText size={20} color="gray" />
                                            <Text ml={2} noOfLines={1} maxW="200px" fontSize="sm">
                                                {document.fileName}
                                            </Text>
                                        </Flex>
                                    </Box>
                                    <Tooltip label="Remove File" hasArrow placement="top">
                                        <IconButton
                                            icon={<FiX />}
                                            size="xs"
                                            colorScheme="red"
                                            position="absolute"
                                            top={-2}
                                            right={-2}
                                            borderRadius="full"
                                            onClick={() => setRemoveFile(true)}
                                            aria-label="Remove uploaded file"
                                        />
                                    </Tooltip>
                                </Box>
                            )}

                            {removeFile && document?.fileName && (
                                <Text fontSize="sm" color="red.500" mb={2}>
                                    Currently uploaded file will be removed on save.
                                </Text>
                            )}

                            <Flex align="center" gap={2}>
                                <Input type="file" onChange={(e) => {
                                    setFile(e.target.files[0]);
                                    setRemoveFile(false); // If they upload a new file, we don't strictly need just 'removeFile'
                                }} p={1} ref={fileInputRef} />
                                {file && (
                                    <IconButton
                                        icon={<FiX />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={handleRemoveSelectedFile}
                                        aria-label="Remove selected file"
                                        variant="ghost"
                                    />
                                )}
                            </Flex>
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={loading}>
                        Cancel
                    </Button>
                    <Button colorScheme="brand" type="submit" isLoading={loading}>
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditDocumentModal;
