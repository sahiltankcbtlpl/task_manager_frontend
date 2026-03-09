import { useState, useEffect, useRef } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, Textarea, useToast, VStack, Flex, IconButton
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { createDocument } from '../../api/document.api';
import { useProject } from '../../context/ProjectContext';
import { getProjectMembers } from '../../api/project.api';
import TableSelect from '../../components/common/TableSelect';
import Select from 'react-select'; // Use a multi-select if available or just map over it.
// React-select is standard, but assuming standard chakra ui is used, let's use a basic multi-select approach

const UploadDocumentModal = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [allowedUsers, setAllowedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [memberOptions, setMemberOptions] = useState([]);
    const { activeProjectId } = useProject();
    const toast = useToast();
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && activeProjectId) {
            const fetchMembers = async () => {
                try {
                    const members = await getProjectMembers(activeProjectId);
                    setMemberOptions(members.map(m => ({ value: m._id, label: m.name })));
                } catch (error) {
                    console.error('Failed to fetch project members', error);
                }
            };
            fetchMembers();
        }
    }, [isOpen, activeProjectId]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setFile(null);
        setAllowedUsers([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveSelectedFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !name || !description) {
            toast({ title: 'Please fill all required fields', status: 'error' });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('project', activeProjectId);
            formData.append('name', name);
            formData.append('description', description);
            formData.append('file', file);

            // Append allowed users as a JSON string
            if (allowedUsers.length > 0) {
                formData.append('allowedUsers', JSON.stringify(allowedUsers.map(opt => opt.value)));
            }

            await createDocument(formData);
            toast({ title: 'Document uploaded', status: 'success' });
            onSuccess();
            handleClose();
        } catch (error) {
            toast({
                title: 'Upload failed',
                description: error.response?.data?.message,
                status: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>Upload Document</ModalHeader>
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
                            {/* Simple multi select or native select multiple */}
                            <Select
                                isMulti
                                options={memberOptions}
                                value={allowedUsers}
                                onChange={setAllowedUsers}
                                placeholder="Select users (optional)"
                            />
                        </FormControl>

                        <FormControl isRequired={!file}>
                            <FormLabel>File</FormLabel>
                            <Flex align="center" gap={2}>
                                <Input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    p={1}
                                    ref={fileInputRef}
                                />
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
                    <Button variant="ghost" mr={3} onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="brand" type="submit" isLoading={loading}>
                        Upload
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default UploadDocumentModal;
