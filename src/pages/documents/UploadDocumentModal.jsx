import { useState, useEffect, useRef } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, Textarea, useToast, VStack, Flex, IconButton
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { createDocument } from '../../api/document.api';
import { useProject } from '../../context/ProjectContext';
import { getProjectMembers, getProjects } from '../../api/project.api';
import useAuth from '../../hooks/useAuth';
import Select from 'react-select';

const UploadDocumentModal = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [allowedUsers, setAllowedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [memberOptions, setMemberOptions] = useState([]);
    const [projectOptions, setProjectOptions] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    const { activeProjectId } = useProject();
    const { user: currentUser } = useAuth();
    const toast = useToast();
    const fileInputRef = useRef(null);

    // Fetch projects if no active project is selected
    useEffect(() => {
        if (isOpen && !activeProjectId) {
            const fetchProjects = async () => {
                try {
                    const data = await getProjects();
                    const projects = Array.isArray(data) ? data : (data.projects || []);
                    const options = projects.map(p => ({ value: p._id, label: p.title }));
                    setProjectOptions(options);
                } catch (error) {
                    console.error('Failed to fetch projects', error);
                }
            };
            fetchProjects();
        }
    }, [isOpen, activeProjectId]);

    // Fetch members when the selected project changes
    useEffect(() => {
        const projectId = activeProjectId || selectedProject?.value;
        if (isOpen && projectId) {
            const fetchMembers = async () => {
                try {
                    const members = await getProjectMembers(projectId);
                    const options = members
                        .filter(m => m._id !== currentUser?._id)
                        .map(m => ({ value: m._id, label: m.name }));
                    setMemberOptions(options);
                } catch (error) {
                    console.error('Failed to fetch project members', error);
                }
            };
            fetchMembers();
        } else {
            setMemberOptions([]);
            setAllowedUsers([]);
        }
    }, [isOpen, activeProjectId, selectedProject, currentUser?._id]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setFile(null);
        setAllowedUsers([]);
        setSelectedProject(null);
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
        
        const projectId = activeProjectId || selectedProject?.value;
        
        if (!projectId) {
            toast({ title: 'Please select a project', status: 'error' });
            return;
        }

        if (!file || !name || !description) {
            toast({ title: 'Please fill all required fields', status: 'error' });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('project', projectId);
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
                description: error.response?.data?.message || 'Something went wrong',
                duration: 2000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>Upload Document</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {!activeProjectId && (
                            <FormControl isRequired>
                                <FormLabel>Project</FormLabel>
                                <Select
                                    options={projectOptions}
                                    value={selectedProject}
                                    onChange={(option) => {
                                        setSelectedProject(option);
                                        setAllowedUsers([]); // Reset allowed users when project changes
                                    }}
                                    placeholder="Select a project"
                                />
                            </FormControl>
                        )}

                        <FormControl isRequired>
                            <FormLabel>Document Name</FormLabel>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Roadmap" />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Description</FormLabel>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this document about?" />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Allowed Users</FormLabel>
                            <Select
                                isMulti
                                options={memberOptions}
                                value={allowedUsers}
                                onChange={setAllowedUsers}
                                placeholder={activeProjectId || selectedProject ? "Select users (optional)" : "Select a project first"}
                                isDisabled={!activeProjectId && !selectedProject}
                            />
                        </FormControl>

                        <FormControl isRequired>
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
                        Upload Document
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default UploadDocumentModal;
