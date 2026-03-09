import { Box, Heading, Flex, Button, useToast, Badge, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Text, VStack, Divider, IconButton } from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getDocuments, downloadDocument, deleteDocument, requestReview } from '../../api/document.api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/feedback/EmptyState';
import { FiPlus, FiFileText, FiDownload, FiEye } from 'react-icons/fi';
import DataTable from '../../components/common/DataTable';
import { useProject } from '../../context/ProjectContext';
import useAuth from '../../hooks/useAuth';
import UploadDocumentModal from './UploadDocumentModal';
import EditDocumentModal from './EditDocumentModal';
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
    const { activeProjectId, setActiveProjectId } = useProject();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDocForEdit, setSelectedDocForEdit] = useState(null);
    const [selectedDocForReview, setSelectedDocForReview] = useState(null);

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

    const handleDownload = async (docId, fileName) => {
        try {
            const blob = await downloadDocument(docId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast({
                title: 'Download failed',
                status: 'error'
            });
        }
    };



    const handleRequestAccess = async (docId) => {
        try {
            await requestReview(docId);
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

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await deleteDocument(docId);
            toast({ title: 'Document deleted', status: 'success' });
            fetchDocs();
        } catch (error) {
            toast({
                title: 'Failed to delete',
                description: error.response?.data?.message,
                status: 'error'
            });
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
                                onClick={() => handleRequestAccess(doc._id)}
                                isDisabled={doc.reviewRequests?.some(r => r.requestedBy === currentUser?._id || r.requestedBy?._id === currentUser?._id)}
                            >
                                {doc.reviewRequests?.some(r => (r.requestedBy === currentUser?._id || r.requestedBy?._id === currentUser?._id) && r.status === 'pending') ? 'Requested' : 'Request Access'}
                            </Button>
                        ) : doc.fileName ? (
                            <Button size="sm" colorScheme="blue" leftIcon={<FiDownload />} onClick={() => handleDownload(doc._id, doc.fileName)}>
                                Download
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

                        {doc.isOwner && (
                            <TableActions
                                onEdit={() => setSelectedDocForEdit(doc)}
                                onDelete={() => handleDelete(doc._id)}
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
                <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => setIsUploadModalOpen(true)}>
                    Upload Document
                </Button>
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
                <Loader />
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
                isOpen={!!selectedDocForEdit}
                onClose={() => setSelectedDocForEdit(null)}
                onSuccess={fetchDocs}
                document={selectedDocForEdit}
            />

            <ReviewRequestModal
                isOpen={!!selectedDocForReview}
                onClose={() => setSelectedDocForReview(null)}
                onSuccess={fetchDocs}
                document={selectedDocForReview}
            />


        </Box>
    );
};

export default DocumentList;
