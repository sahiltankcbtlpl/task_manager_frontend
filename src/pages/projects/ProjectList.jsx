import React, { useEffect, useState, useMemo } from 'react';
import { Box, Heading, Flex, Button, useToast, Wrap, WrapItem, Tag, Avatar, TagLabel, Text } from '@chakra-ui/react';
import { FiPlus, FiCheckSquare } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { getProjects, deleteProject } from '../../api/project.api';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/feedback/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import CanAccess from '../../components/common/CanAccess';
import TableActions from '../../components/common/TableActions';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../config/routes.config';
import { hasPermission } from '../../utils/permissions';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { user: currentUser } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const params = {};
            // Assuming the backend handles search if provided, or we can filter client-side
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const projectsData = await getProjects(params);

            // Client-side search if backend doesn't support query.search
            if (debouncedSearchTerm) {
                const term = debouncedSearchTerm.toLowerCase();
                const filtered = projectsData.filter(p => p.title?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term));
                setProjects(filtered);
            } else {
                setProjects(projectsData);
            }
        } catch (error) {
            toast({
                title: 'Error fetching projects',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await deleteProject(id);
            toast({ title: 'Project deleted', status: 'success' });
            fetchProjects();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete', status: 'error' });
        }
    };

    const columns = useMemo(() => {
        const cols = [
            {
                header: 'Title',
                accessor: 'title',
            },
            {
                header: 'Description',
                accessor: 'description',
                render: (project) => project.description || 'N/A'
            },
            {
                header: 'Members',
                accessor: 'members',
                render: (project) => project.members?.length > 0 ? (
                    <Wrap spacing={2}>
                        {project.members.map(m => (
                            <WrapItem key={m._id || m}>
                                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                                    <Avatar name={m.name} size="xs" ml={-1} mr={2} />
                                    <TagLabel>{m.name}</TagLabel>
                                </Tag>
                            </WrapItem>
                        ))}
                    </Wrap>
                ) : (
                    <Text color="gray.500" fontSize="sm" fontStyle="italic">None</Text>
                )
            },
            {
                header: 'Created By',
                accessor: 'createdBy',
                render: (project) => project.createdBy?.name || 'Unknown'
            }
        ];

        if (hasPermission(currentUser, 'projects-update') || hasPermission(currentUser, 'projects-delete')) {
            cols.push({
                header: 'Actions',
                render: (project) => (
                    <TableActions
                        onEdit={`${ROUTES.PROJECTS}/edit/${project._id}`}
                        onDelete={() => handleDelete(project._id)}
                        editPermission="projects-update"
                        deletePermission="projects-delete"
                        item={project}
                    />
                )
            });
        }

        return cols;
    }, [currentUser]);

    const totalItems = projects.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedProjects = projects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Projects</Heading>
                <CanAccess permission="projects-create">
                    <Link to={ROUTES.CREATE_PROJECT}>
                        <Button leftIcon={<FiPlus />} colorScheme="brand">Create Project</Button>
                    </Link>
                </CanAccess>
            </Flex>

            <Flex mb={4} gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                    <SearchBar
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
            </Flex>

            {loading ? (
                <Loader />
            ) : projects.length === 0 ? (
                <EmptyState title="No Projects" description="Create a project to get started" icon={FiCheckSquare} />
            ) : (
                <DataTable
                    columns={columns}
                    data={paginatedProjects}
                    isLoading={loading}
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                        pageSize,
                        onPageSizeChange: setPageSize,
                        totalItems
                    }}
                />
            )}
        </Box>
    );
};

export default ProjectList;
