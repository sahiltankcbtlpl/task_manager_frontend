import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    useToast,
    Text,
    VStack,
    Box,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { bulkUploadTasks } from '../../api/task.api';
import { getProjects } from '../../api/project.api';
import api from '../../api/axios';

const BulkUploadModal = ({ isOpen, onClose, category = 'TASK', onSuccess }) => {
    const { activeProjectId } = useProject();
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [uploadResult, setUploadResult] = useState(null);
    useEffect(() => {
        if (isOpen && !activeProjectId) {
            getProjects().then(data => {
                setProjects(data.map(p => ({ label: p.title, value: p._id })));
            }).catch(err => {
                console.error('Failed to load projects', err);
            });
        }
        if (isOpen) {
            setFile(null);
            setUploadResult(null);
            setSelectedProject('');
        }
    }, [isOpen, activeProjectId]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const ext = selectedFile.name.split('.').pop().toLowerCase();
            if (ext !== 'xlsx') {
                toast({
                    title: 'Invalid file type',
                    description: 'Only .xlsx files are allowed',
                    status: 'error',
                });
                e.target.value = null;
                setFile(null);
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({ title: 'Please select a file', status: 'warning' });
            return;
        }

        const projectToUse = activeProjectId || selectedProject;
        if (!projectToUse) {
            toast({ title: 'Please select a project', status: 'warning' });
            return;
        }

        setIsUploading(true);
        setUploadResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('project', projectToUse);
            formData.append('category', category);

            const result = await bulkUploadTasks(formData);

            setUploadResult({
                success: true,
                message: result.message,
                errors: result.errors || [],
            });

            toast({
                title: 'Upload completed',
                status: result.errors?.length > 0 ? 'warning' : 'success',
                duration: 5000,
            });

            // We no longer call onSuccess() here because the backend now emits
            // a 'taskCreated' Socket.IO event which automatically triggers 
            // all connected clients (including this one) to refetch their tasks.

            // Auto-close if there are no errors
            if (!result.errors || result.errors.length === 0) {
                setTimeout(() => {
                    onClose();
                }, 300);
            }

        } catch (error) {
            setUploadResult({
                success: false,
                message: error.response?.data?.message || 'Failed to upload tasks',
                errors: [],
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Bulk Upload {category === 'ISSUE' ? 'Issues' : 'Tasks'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {/* <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <AlertTitle fontSize="sm">Excel Format Requirements</AlertTitle>
                                <AlertDescription fontSize="sm">
                                    Columns: <b>Title</b>, <b>Description</b>, <b>Assignee Email</b>, <b>Status</b><br />
                                    <i>Only .xlsx files are supported. Title is required. If Assignee Email is missing or invalid, the task will be created as "Unassigned". Attachments are not supported.</i>
                                </AlertDescription>
                            </Box>
                        </Alert> */}

                        {!activeProjectId && (
                            <FormControl isRequired>
                                <FormLabel>Select Project</FormLabel>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </FormControl>
                        )}

                        <FormControl isRequired>
                            <FormLabel>Excel File (.xlsx)</FormLabel>
                            <Input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                p={1}
                            />
                        </FormControl>

                        {uploadResult && (
                            <Box mt={4} p={3} borderRadius="md" bg={uploadResult.success ? (uploadResult.errors.length > 0 ? 'yellow.50' : 'green.50') : 'red.50'}>
                                <Text fontWeight="bold" color={uploadResult.success ? (uploadResult.errors.length > 0 ? 'yellow.700' : 'green.700') : 'red.700'}>
                                    {uploadResult.message}
                                </Text>
                                {uploadResult.errors && uploadResult.errors.length > 0 && (
                                    <Box mt={2} maxHeight="150px" overflowY="auto">
                                        <Text fontSize="sm" fontWeight="bold">Errors:</Text>
                                        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'red' }}>
                                            {uploadResult.errors.map((err, i) => (
                                                <li key={i}>
                                                    {typeof err === 'string' ? err : `Row ${err.row}: ${err.message}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter display="flex" justifyContent="space-between">
                    <Button 
                        variant="outline" 
                        colorScheme="blue" 
                        size="sm"
                        as="a" 
                        href={`${api.defaults.baseURL.replace('/api', '')}/public/samples/bulk-upload-sample.xlsx`}
                        download
                    >
                        Download Sample
                    </Button>
                    <Box>
                        <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isUploading}>
                            Close
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleUpload}
                            isLoading={isUploading}
                            loadingText="Uploading..."
                        >
                            Upload
                        </Button>
                    </Box>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BulkUploadModal;
