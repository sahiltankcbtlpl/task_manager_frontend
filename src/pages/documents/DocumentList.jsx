import { Box, Heading, Flex, Button, useToast, Badge, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Text, VStack, Divider, IconButton, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Menu, MenuButton, MenuList, MenuItem, FormControl, FormLabel, Select } from '@chakra-ui/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getDocuments, deleteDocument, requestReview } from '../../api/document.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiFileText, FiEye, FiEdit2, FiChevronDown } from 'react-icons/fi';
import DataTable from '../../components/common/DataTable';
import { useProject } from '../../context/ProjectContext';
import useAuth from '../../hooks/useAuth';
import UploadDocumentModal from './UploadDocumentModal';
import EditDocumentModal from './EditDocumentModal';
import DocumentEditorModal from './DocumentEditorModal';
import ReviewRequestModal from './ReviewRequestModal';
import TableActions from '../../components/common/TableActions';
import SearchBar from '../../components/common/SearchBar';
import useDebounce from '../../hooks/useDebounce';

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 5, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { user: currentUser } = useAuth();
    const { activeProjectId, setActiveProjectId, projects } = useProject();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isProjectSelectModalOpen, setIsProjectSelectModalOpen] = useState(false);
    const [pendingDocType, setPendingDocType] = useState(null);
    const [tempSelectedProject, setTempSelectedProject] = useState('');

    const handleCreateClick = (type) => {
        if (!activeProjectId) {
            setPendingDocType(type);
            setTempSelectedProject('');
            setIsProjectSelectModalOpen(true);
        } else {
            setSelectedDocForEdit({ name: `Untitled.${type}` });
            setIsEditorModalOpen(true);
        }
    };

    const handleConfirmProjectSelection = () => {
        if (!tempSelectedProject) {
            toast({ title: 'Please select a project first', status: 'warning' });
            return;
        }
        setActiveProjectId(tempSelectedProject);
        setIsProjectSelectModalOpen(false);
        setTimeout(() => {
            setSelectedDocForEdit({ name: `Untitled.${pendingDocType}` });
            setIsEditorModalOpen(true);
        }, 100);
    };
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [selectedDocForEdit, setSelectedDocForEdit] = useState(null);
    const [selectedDocForReview, setSelectedDocForReview] = useState(null);

    // Delete Confirmation State
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const cancelRef = useRef();
    const [docToDelete, setDocToDelete] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchDocs = async (page = 1, limit = 5) => {
        try {
            setLoading(true);
            const data = await getDocuments(activeProjectId || '', page, limit, debouncedSearchTerm);
            setDocuments(data.documents || []);
            setPagination(data.pagination || { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 0 });

            // Open review modal automatically if URL has a review parameter
            const reviewDocId = searchParams.get('review');
            const sharedDocId = searchParams.get('sharedDoc');

            if (reviewDocId) {
                const docToReview = data.documents?.find(d => d._id === reviewDocId);
                const isPending = docToReview?.reviewRequests?.some(r => r.status === 'pending');

                if (docToReview && docToReview.isOwner && isPending) {
                    setSelectedDocForReview(docToReview);
                    // Clean up URL so it doesn't open again on refresh
                    searchParams.delete('review');
                    searchParams.delete('project');
                    setSearchParams(searchParams);
                } else if (!isPending) {
                    // Redirect to dashboard if no pending request for this document
                    window.location.href = '/';
                }
            } else if (sharedDocId) {
                const sharedDoc = data.documents?.find(d => d._id === sharedDocId);
                if (sharedDoc) {
                    // Automatically trigger the viewer for the shared document
                    handleView(sharedDoc);
                    // Clean up URL
                    searchParams.delete('sharedDoc');
                    setSearchParams(searchParams);
                }
            }
        } catch (error) {
            toast({
                title: 'Error fetching documents',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const projectParam = searchParams.get('project');
        if (projectParam && projectParam !== activeProjectId) {
            setActiveProjectId(projectParam);
        } else {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
            fetchDocs(1, pagination.pageSize);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProjectId, searchParams, setActiveProjectId, debouncedSearchTerm]);

    const handleView = (doc) => {
        if (doc.isEditorDocument) {
            setSelectedDocForEdit(doc);
            setIsEditorModalOpen(true);
            return;
        }

        if (!doc.fileUrl) return;

        const currentOrigin = window.location.origin;
        const currentHostname = window.location.hostname;

        let apiUrl = '';
        if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
            apiUrl = 'http://localhost:5000';
        } else if (currentOrigin.includes('devtunnels.ms')) {
            apiUrl = currentOrigin.replace(/(?:-\d+)?\.inc1\.devtunnels\.ms/, '-5000.inc1.devtunnels.ms');
        } else {
            apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
        }

        const fullUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${apiUrl}${doc.fileUrl}`;
        setViewingDoc({ ...doc, fullUrl });
        setIsViewModalOpen(true);
    };



    const handleRequestAccess = async (docId, type = 'view') => {
        try {
            await requestReview(docId, type);
            toast({ title: 'Access request sent successfully', status: 'success' });
            fetchDocs();
        } catch (error) {
            toast({
                title: 'Error requesting access',
                description: error.response?.data?.message || 'Could not send request',
                status: 'error'
            });
        }
    };

    const confirmDelete = (id) => {
        setDocToDelete(id);
        onAlertOpen();
    };

    const handleDelete = async () => {
        if (!docToDelete) return;
        try {
            await deleteDocument(docToDelete);
            toast({ title: 'Document deleted', status: 'success' });
            fetchDocs();
        } catch (error) {
            toast({
                title: 'Failed to delete',
                description: error.response?.data?.message,
                status: 'error'
            });
        } finally {
            onAlertClose();
            setDocToDelete(null);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            {
                header: 'Name',
                accessor: 'name',
                render: (doc) => (
                    <Box fontWeight="medium" color="brand.600">
                        {doc.name}
                    </Box>
                )
            },
            {
                header: 'Description',
                accessor: 'description',
            },
            {
                header: 'Owner',
                accessor: 'owner',
                render: (doc) => doc.owner?.name
            },
            ...(!activeProjectId ? [{
                header: 'Project',
                accessor: 'project',
                render: (doc) => doc.project?.title || 'N/A'
            }] : []),
            {
                header: 'Actions',
                render: (doc) => (
                    <Flex gap={2}>
                        {!doc.hasAccess ? (
                            <Button
                                size="sm"
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => handleRequestAccess(doc._id, 'view')}
                                isDisabled={doc.reviewRequests?.some(r => (r.requestedBy === currentUser?._id || r.requestedBy?._id === currentUser?._id) && r.requestType === 'view' && r.status === 'pending')}
                            >
                                {doc.reviewRequests?.some(r => (r.requestedBy === currentUser?._id || r.requestedBy?._id === currentUser?._id) && r.requestType === 'view' && r.status === 'pending') ? 'Requested' : 'Request Access'}
                            </Button>
                        ) : (doc.fileUrl || doc.isEditorDocument) ? (
                            <Button size="sm" colorScheme="blue" leftIcon={<FiEye />} onClick={() => handleView(doc)}>
                                View
                            </Button>
                        ) : (
                            <Badge colorScheme="orange">No File Attached</Badge>
                        )}

                        {doc.isOwner && doc.reviewRequests?.some(r => r.status === 'pending') && (
                            <Button size="sm" colorScheme="red" variant="solid" onClick={() => setSelectedDocForReview(doc)}>
                                Pending Requests
                            </Button>
                        )}

                        {doc.isOwner && !doc.reviewRequests?.some(r => r.status === 'pending') && doc.reviewRequests?.length > 0 && (
                            <Button size="sm" colorScheme="gray" onClick={() => setSelectedDocForReview(doc)}>
                                View Requests
                            </Button>
                        )}

                        {(doc.canEdit) && (
                            <TableActions
                                onEdit={() => {
                                    setSelectedDocForEdit(doc);
                                    if (doc.isEditorDocument) {
                                        setIsEditorModalOpen(true);
                                    }
                                }}
                                onDelete={() => confirmDelete(doc._id)}
                                item={doc}
                            />
                        )}
                    </Flex>
                )
            }
        ];
        return cols;
    }, [currentUser, activeProjectId]);

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Documents</Heading>
                <Flex gap={2}>
                    <Menu>
                        <MenuButton as={Button} leftIcon={<FiEdit2 />} rightIcon={<FiChevronDown />} colorScheme="brand" variant="outline">
                            Create Document
                        </MenuButton>
                        <MenuList>
                            <MenuItem onClick={() => handleCreateClick('txt')}>
                                Text File (.txt)
                            </MenuItem>
                            <MenuItem onClick={() => handleCreateClick('docx')}>
                                Doc (.docx)
                            </MenuItem>
                        </MenuList>
                    </Menu>
                    <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => setIsUploadModalOpen(true)}>
                        Upload Document
                    </Button>
                </Flex>
            </Flex>

            <Flex mb={4} gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                    <SearchBar
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
            </Flex>

            {loading ? (
                <Loader type="table" />
            ) : documents.length === 0 ? (
                <EmptyState title="No Documents" description="Upload a document to get started" icon={FiFileText} />
            ) : (
                <DataTable
                    columns={columns}
                    data={documents}
                    isLoading={loading}
                    pagination={{
                        currentPage: pagination.currentPage,
                        totalPages: pagination.totalPages,
                        onPageChange: (newPage) => fetchDocs(newPage, pagination.pageSize),
                        pageSize: pagination.pageSize,
                        onPageSizeChange: (newPageSize) => fetchDocs(1, newPageSize),
                        totalItems: pagination.totalItems
                    }}
                />
            )}

            <UploadDocumentModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={fetchDocs}
            />

            <EditDocumentModal
                isOpen={!!selectedDocForEdit && !selectedDocForEdit?.isEditorDocument}
                onClose={() => setSelectedDocForEdit(null)}
                onSuccess={fetchDocs}
                document={selectedDocForEdit}
            />

            <DocumentEditorModal
                isOpen={isEditorModalOpen}
                onClose={() => {
                    setIsEditorModalOpen(false);
                    setSelectedDocForEdit(null);
                }}
                onSuccess={fetchDocs}
                document={selectedDocForEdit}
            />

            <ReviewRequestModal
                isOpen={!!selectedDocForReview}
                onClose={() => setSelectedDocForReview(null)}
                onSuccess={fetchDocs}
                document={selectedDocForReview}
            />

            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onAlertClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Document
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure? You can't undo this action afterwards.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onAlertClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Select Project Required Modal */}
            <Modal isOpen={isProjectSelectModalOpen} onClose={() => setIsProjectSelectModalOpen(false)}>
                <ModalOverlay />
                <ModalContent p={2}>
                    <ModalHeader pb={2}>Select a Project</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text mb={4} color="gray.600" fontSize="sm">
                            Documents must be created inside a project. Please select one to continue.
                        </Text>
                        <FormControl>
                            <FormLabel>Project</FormLabel>
                            <Select
                                placeholder="Select a project"
                                value={tempSelectedProject}
                                onChange={(e) => setTempSelectedProject(e.target.value)}
                            >
                                {projects?.map(p => (
                                    <option key={p._id} value={p._id}>{p.title}</option>
                                ))}
                            </Select>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="brand" onClick={handleConfirmProjectSelection} isDisabled={!tempSelectedProject}>
                            Continue
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Document Viewer Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="5xl" isCentered>
                <ModalOverlay />
                <ModalContent height="85vh">
                    <ModalHeader borderBottomWidth="1px" pb={2}>
                        <Flex justify="space-between" align="center" w="full" pr={8}>
                            <Box>
                                <Heading size="md">{viewingDoc?.name}</Heading>
                                <Text fontSize="xs" fontWeight="normal" color="gray.500">
                                    {viewingDoc?.fileName}
                                </Text>
                            </Box>
                            {/* Visual cue for shared access */}
                            <Badge colorScheme="green" variant="subtle" px={2} py={1} borderRadius="full">
                                Access Granted
                            </Badge>
                        </Flex>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody p={0} bg="gray.100" overflow="hidden">
                        <Flex h="full" w="full" align="center" justify="center">
                            {viewingDoc?.fileName?.toLowerCase().endsWith('.pdf') ? (
                                <Box as="iframe" src={viewingDoc.fullUrl} width="100%" height="100%" border="none" />
                            ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingDoc?.fileName) ? (
                                <Box as="img" src={viewingDoc.fullUrl} maxW="100%" maxH="100%" objectFit="contain" />
                            ) : (
                                <VStack spacing={4} p={8} bg="white" borderRadius="md" shadow="md">
                                    <FiFileText size={48} color="orange" />
                                    <Heading size="md">Preview Not Available</Heading>
                                    <Text textAlign="center">
                                        Browsers cannot display <strong>{viewingDoc?.fileName?.split('.').pop().toUpperCase()}</strong> files directly.
                                        <br />
                                        Please use the link below to open it.
                                    </Text>
                                    <Button as="a" href={viewingDoc?.fullUrl} target="_blank" colorScheme="brand" leftIcon={<FiEye />}>
                                        Open in New Tab
                                    </Button>
                                </VStack>
                            )}
                        </Flex>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px">
                        <Button mr={3} onClick={() => setIsViewModalOpen(false)}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default DocumentList;
