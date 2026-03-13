import { useState, useEffect } from 'react';
import {
    Heading, Modal, ModalOverlay, ModalContent, ModalHeader, 
    ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
    Input, useToast, VStack, Flex, Text, Switch, Badge, Box,
    IconButton, Divider, HStack } from '@chakra-ui/react';
import { FiSave, FiCheck, FiRefreshCw, FiAlertCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { createDocument, updateDocument, autosaveDocument, requestAccess } from '../../api/document.api';
import { updateProfile } from '../../api/auth.api';
import { useProject } from '../../context/ProjectContext';
import { getProjectMembers } from '../../api/project.api';
import useAuth from '../../hooks/useAuth';
import Select from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const DocumentEditorModal = ({ isOpen, onClose, onSuccess, document = null }) => {
    const [name, setName] = useState('Untitled.txt');
    const [content, setContent] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingStatus, setSavingStatus] = useState('idle'); // idle, saving, saved, unsaved
    const [isEditingName, setIsEditingName] = useState(false);

    const { activeProjectId } = useProject();
    const { user: currentUser, updateUser: updateAuthUser } = useAuth();
    const toast = useToast();
    const [memberOptions, setMemberOptions] = useState([]);
    const [currentDoc, setCurrentDoc] = useState(document);

    useEffect(() => {
        if (isOpen) {
            if (document) {
                setName(document.name || 'Untitled.txt');
                setContent(document.content || '');
                setPermissions(document.permissions || []);
                setCurrentDoc(document);
                setSavingStatus('saved');
            } else {
                setName('Untitled.txt');
                setContent('');
                setPermissions([]);
                setCurrentDoc(null);
                setSavingStatus('idle');
            }
            fetchMembers();
        }
    }, [isOpen, document]);

    const fetchMembers = async () => {
        try {
            const members = await getProjectMembers(activeProjectId);
            const options = members
                .filter(m => m._id !== currentUser?._id && m._id !== document?.owner?._id && m._id !== document?.owner)
                .map(m => ({ value: m._id, label: m.name }));
            setMemberOptions(options);
        } catch (error) {
            console.error('Failed to fetch project members', error);
        }
    };

    const handleSave = async (isAuto = false) => {
        if (!name.trim()) {
            toast({ title: 'Document name is required', status: 'error' });
            return;
        }

        try {
            if (!isAuto) setLoading(true);
            setSavingStatus('saving');

            if (currentDoc?._id) {
                if (isAuto) {
                    const updated = await autosaveDocument(currentDoc._id, { content, name, permissions });
                    setCurrentDoc(updated);
                } else {
                    const updated = await updateDocument(currentDoc._id, {
                        name,
                        content,
                        permissions
                    });
                    setCurrentDoc(updated);
                }
            } else {
                const newData = await createDocument({
                    project: activeProjectId,
                    name,
                    content,
                    isEditorDocument: true,
                    description: 'Text document', // default description
                    permissions
                });
                setCurrentDoc(newData);
            }

            setSavingStatus('saved');
            if (!isAuto) {
                toast({ title: 'Document saved', status: 'success' });
            }
            onSuccess();
        } catch (error) {
            console.error('Save failed:', error);
            setSavingStatus('unsaved');
            if (!isAuto) {
                toast({
                    title: 'Save failed',
                    description: error.response?.data?.message || 'Check your connection or permissions',
                    status: 'error'
                });
            }
        } finally {
            if (!isAuto) setLoading(false);
        }
    };

    const handleRequestEditAccess = async () => {
        try {
            setLoading(true);
            const updatedDoc = await requestAccess(currentDoc?._id, 'edit'); // Explicitly pass 'edit'
            setCurrentDoc(updatedDoc);
            toast({ title: 'Edit access request sent', status: 'success' });
        } catch (error) {
            toast({
                title: 'Request failed',
                description: error.response?.data?.message || 'Could not send request',
                status: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.autosavePreference && savingStatus === 'unsaved') {
            const timer = setTimeout(() => {
                handleSave(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [name, content, permissions, currentUser?.autosavePreference, savingStatus]);

    const handleContentChange = (newContent) => {
        setContent(newContent);
        if (savingStatus === 'saved' || savingStatus === 'idle') {
            setSavingStatus('unsaved');
        }
    };

    const handleNameChange = (newName) => {
        setName(newName);
        if (savingStatus === 'saved' || savingStatus === 'idle') {
            setSavingStatus('unsaved');
        }
    };

    const handleAddPermission = (userId, access) => {
        if (permissions.some(p => p.user === userId)) return;
        setPermissions([...permissions, { user: userId, access }]);
        setSavingStatus('unsaved');
    };

    const handleRemovePermission = (userId) => {
        setPermissions(permissions.filter(p => p.user !== userId));
        setSavingStatus('unsaved');
    };

    const handleClose = async () => {
        if (savingStatus === 'unsaved') {
            if (currentUser?.autosavePreference) {
                // Force a final save before closing
                await handleSave(true);
            } else {
                // eslint-disable-next-line no-restricted-globals
                if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                    return;
                }
            }
        }
        onClose();
    };

    const compareIds = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s1 = typeof id1 === 'object' ? id1._id || id1 : id1;
        const s2 = typeof id2 === 'object' ? id2._id || id2 : id2;
        return String(s1) === String(s2);
    };

    const isOwner = !currentDoc || compareIds(currentDoc.owner, currentUser);
    const hasEditPermission = currentDoc?.permissions?.some(p => compareIds(p.user, currentUser) && p.access === 'edit');
    const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role?.name === 'Super Admin';
    const canEdit = isOwner || hasEditPermission || isSuperAdmin;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="full">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader borderBottomWidth="1px">
                    <Flex justify="space-between" align="center" pr={10}>
                        <HStack spacing={4}>
                            {isEditingName ? (
                                <Input
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    onBlur={() => setIsEditingName(false)}
                                    autoFocus
                                    size="sm"
                                    maxW="300px"
                                />
                            ) : (
                                <HStack spacing={2} onClick={() => canEdit && setIsEditingName(true)} cursor={canEdit ? "pointer" : "default"}>
                                    <Heading size="md">{name}</Heading>
                                    {canEdit && <FiEdit2 size={12} color="gray" />}
                                </HStack>
                            )}
                            <Box>
                                {savingStatus === 'saving' && <Badge colorScheme="blue"><FiRefreshCw className="spin" style={{ display: 'inline', marginRight: '4px' }} /> Saving...</Badge>}
                                {savingStatus === 'saved' && <Badge colorScheme="green"><FiCheck style={{ display: 'inline', marginRight: '4px' }} /> Saved</Badge>}
                                {savingStatus === 'unsaved' && <Badge colorScheme="orange"><FiAlertCircle style={{ display: 'inline', marginRight: '4px' }} /> Unsaved changes</Badge>}
                            </Box>
                        </HStack>
                        <HStack spacing={6}>
                            {canEdit && (
                                <HStack spacing={2} minW="120px">
                                    <Text fontSize="sm" fontWeight="medium">Autosave</Text>
                                    <Switch
                                        isChecked={currentUser?.autosavePreference || false}
                                        onChange={async () => {
                                            try {
                                                const newPreference = !currentUser?.autosavePreference;
                                                const updatedUser = await updateProfile({ autosavePreference: newPreference });
                                                updateAuthUser(updatedUser);
                                                toast({ title: `Autosave ${newPreference ? 'Enabled' : 'Disabled'}`, status: 'success', duration: 2000 });
                                            } catch (error) {
                                                toast({ title: 'Failed to update autosave preference', status: 'error' });
                                            }
                                        }}
                                        isDisabled={!canEdit}
                                        colorScheme="brand"
                                    />
                                </HStack>
                            )}
                            
                            <Box minW="140px" display="flex" justifyContent="center">
                                {!currentUser?.autosavePreference && canEdit && (
                                    <Button
                                        leftIcon={<FiSave />}
                                        colorScheme="brand"
                                        onClick={() => handleSave()}
                                        isLoading={loading}
                                        size="sm"
                                        w="full"
                                    >
                                        Save
                                    </Button>
                                )}
                                {!canEdit && currentDoc && (
                                    <Button
                                        leftIcon={currentDoc.reviewRequests?.some(r => compareIds(r.requestedBy, currentUser) && r.requestType === 'edit' && r.status === 'pending') ? <FiCheck /> : <FiEdit2 />}
                                        colorScheme="orange"
                                        onClick={handleRequestEditAccess}
                                        isLoading={loading}
                                        size="sm"
                                        w="full"
                                        isDisabled={currentDoc.reviewRequests?.some(r => compareIds(r.requestedBy, currentUser) && r.requestType === 'edit' && r.status === 'pending')}
                                    >
                                        {currentDoc.reviewRequests?.some(r => compareIds(r.requestedBy, currentUser) && r.requestType === 'edit' && r.status === 'pending') ? 'Requested' : 'Request Edit Access'}
                                    </Button>
                                )}
                            </Box>
                            
                            <ModalCloseButton position="static" />
                        </HStack>
                    </Flex>
                </ModalHeader>
                <ModalBody p={0} display="flex" flexDirection="row" bg="gray.100" overflow="hidden">
                    {/* Editor Area */}
                    <Box 
                        flex="1" 
                        p={10} 
                        overflowY="auto" 
                        display="flex" 
                        flexDirection="column" 
                        alignItems="center"
                        css={{
                            '&::-webkit-scrollbar': { width: '8px' },
                            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' },
                        }}
                    >
                        <Box 
                            bg="white" 
                            shadow="lg" 
                            w="210mm" 
                            minH="297mm" 
                            p="25mm" 
                            mb={10} 
                            position="relative"
                            className="document-page"
                            border="1px solid"
                            borderColor="gray.300"
                        >
                            <CKEditor
                                editor={ClassicEditor}
                                data={content}
                                disabled={!canEdit}
                                onChange={(event, editor) => {
                                    handleContentChange(editor.getData());
                                }}
                                onReady={editor => {
                                    editor.editing.view.change(writer => {
                                        writer.setStyle('min-height', '247mm', editor.editing.view.document.getRoot());
                                        writer.setStyle('outline', 'none', editor.editing.view.document.getRoot());
                                    });
                                }}
                                config={{
                                    placeholder: 'Start typing your document content here...',
                                    toolbar: {
                                        items: [
                                            'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'
                                        ],
                                        shouldNotGroupWhenFull: true
                                    }
                                }}
                            />
                        </Box>
                        
                        {/* Simulation of subsequent pages if content length is high */}
                        {Array.from({ length: Math.max(0, Math.ceil(content.length / 4000) - 1) }).map((_, i) => (
                            <Box 
                                key={i}
                                bg="white" 
                                shadow="lg" 
                                w="210mm" 
                                minH="297mm" 
                                mb={10} 
                                border="1px solid"
                                borderColor="gray.300"
                            />
                        ))}
                    </Box>

                    {/* Sidebar Area */}
                    <Box w="300px" borderLeftWidth="1px" p={4} bg="white">
                        <VStack align="stretch" spacing={6}>
                            <Box>
                                <Heading size="xs" mb={3} textTransform="uppercase" color="gray.500">Document Settings</Heading>
                                <FormControl>
                                    <FormLabel fontSize="sm">Permissions</FormLabel>
                                    {isOwner || isSuperAdmin ? (
                                        <VStack align="stretch" spacing={3}>
                                            <Select
                                                options={memberOptions}
                                                placeholder="Add user..."
                                                onChange={(opt) => opt && handleAddPermission(opt.value, 'view')}
                                                value={null}
                                            />
                                            <VStack align="stretch" spacing={2}>
                                                {permissions.map((p, idx) => (
                                                    <Flex key={idx} justify="space-between" align="center" p={2} bg="gray.50" borderRadius="md" fontSize="sm">
                                                        <Text isTruncated maxW="150px">{memberOptions.find(m => m.value === p.user)?.label || 'User'}</Text>
                                                        <HStack>
                                                            <Select
                                                                size="sm"
                                                                options={[
                                                                    { value: 'view', label: 'View' },
                                                                    { value: 'edit', label: 'Edit' }
                                                                ]}
                                                                defaultValue={{ value: p.access, label: p.access.charAt(0).toUpperCase() + p.access.slice(1) }}
                                                                onChange={(opt) => {
                                                                    const newPerms = [...permissions];
                                                                    newPerms[idx].access = opt.value;
                                                                    setPermissions(newPerms);
                                                                    setSavingStatus('unsaved');
                                                                }}
                                                                styles={{
                                                                    control: (base) => ({ ...base, minHeight: '24px', fontSize: '12px' }),
                                                                }}
                                                            />
                                                            <IconButton
                                                                icon={<FiTrash2 />}
                                                                aria-label="Remove permission"
                                                                size="xs"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => handleRemovePermission(p.user)}
                                                            />
                                                        </HStack>
                                                    </Flex>
                                                ))}
                                            </VStack>
                                        </VStack>
                                    ) : (
                                        <Text fontSize="sm" color="gray.500">Only the owner can manage permissions.</Text>
                                    )}
                                </FormControl>
                            </Box>
                            
                            <Divider />
                            
                            <Box>
                                <Heading size="xs" mb={3} textTransform="uppercase" color="gray.500">Info</Heading>
                                <VStack align="stretch" spacing={2} fontSize="sm">
                                    <Flex justify="space-between">
                                        <Text color="gray.500">Owner:</Text>
                                        <Text fontWeight="medium">{currentDoc?.owner?.name || currentUser?.name}</Text>
                                    </Flex>
                                    <Flex justify="space-between">
                                        <Text color="gray.500">Last Updated:</Text>
                                        <Text fontWeight="medium">{currentDoc ? new Date(currentDoc.updatedAt).toLocaleString() : 'Just now'}</Text>
                                    </Flex>
                                </VStack>
                            </Box>
                        </VStack>
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default DocumentEditorModal;
