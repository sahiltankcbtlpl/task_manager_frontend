import React, { useEffect, useState, useMemo } from 'react';
import { Box, Heading, Flex, useToast, Text, Wrap, WrapItem, Tag, Avatar, TagLabel } from '@chakra-ui/react';
import { FiUsers } from 'react-icons/fi';
import { getProjectById, getProjects } from '../../api/project.api';
import EmptyState from '../../components/feedback/EmptyState';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import { useProject } from '../../context/ProjectContext';
import useDebounce from '../../hooks/useDebounce';
import Pagination from '../../components/common/Pagination';

const TeamList = () => {
    const { activeProjectId } = useProject();
    const [teamData, setTeamData] = useState([]); // Array of { project: {}, members: [] }
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Search and Pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                setLoading(true);

                if (activeProjectId) {
                    const projectData = await getProjectById(activeProjectId);
                    setTeamData([{
                        project: projectData,
                        members: projectData.members || []
                    }]);
                } else {
                    const params = {};
                    if (debouncedSearchTerm) params.search = debouncedSearchTerm;

                    const projectsData = await getProjects(params);

                    const formattedData = projectsData.map(p => ({
                        project: p,
                        members: p.members || []
                    }));

                    setTeamData(formattedData);
                }

            } catch (error) {
                console.error("Failed to fetch project details for team view", error);
                toast({
                    title: 'Error formatting team',
                    description: 'Could not load team data.',
                    status: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        // Reset to page 1 when search or project changes
        setCurrentPage(1);
        fetchTeamMembers();
    }, [activeProjectId, toast, debouncedSearchTerm]);

    // Derived filtering for active project (backend handles search for 'All Projects')
    const filteredTeamData = useMemo(() => {
        if (!debouncedSearchTerm || !activeProjectId) return teamData;

        const term = debouncedSearchTerm.toLowerCase();
        return teamData.filter(item => {
            const projectMatches = item.project.title?.toLowerCase().includes(term) ||
                item.project.description?.toLowerCase().includes(term);
            const memberMatches = item.members.some(m => m.name.toLowerCase().includes(term));

            return projectMatches || memberMatches;
        });
    }, [teamData, debouncedSearchTerm, activeProjectId]);

    // Derived pagination based on the filtered results
    const totalItems = filteredTeamData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedTeamData = filteredTeamData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns = useMemo(() => [
        {
            header: 'Name',
            accessor: 'name',
            render: (member) => (
                <Text fontWeight="medium">{member.name}</Text>
            )
        }
    ], []);

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="lg">Team Overview</Heading>
                    <Text color="gray.500" mt={1}>
                        Members of {activeProjectId ? 'selected project' : 'all projects'}
                    </Text>
                </Box>
            </Flex>

            <Flex mb={4} gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                    <SearchBar
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
            </Flex>

            {loading ? (
                <Loader />
            ) : filteredTeamData.length === 0 ? (
                <EmptyState title="No Results" description="No projects or team members matched your search." icon={FiUsers} />
            ) : (
                <Box bg="white" borderRadius="md" shadow="sm" overflow="hidden">
                    {/* Header Row */}
                    <Flex bg="gray.50" px={6} py={4} borderBottomWidth={1} borderColor="gray.200">
                        <Text flex="1" fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wider" textTransform="uppercase">
                            Project Details
                        </Text>
                        <Text flex="1" fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wider" textTransform="uppercase">
                            Assigned Team
                        </Text>
                    </Flex>

                    {/* Data Rows */}
                    {paginatedTeamData.map((data, idx) => (
                        <Flex
                            key={data.project._id}
                            px={6}
                            py={6}
                            borderBottomWidth={idx !== paginatedTeamData.length - 1 ? 1 : 0}
                            borderColor="gray.100"
                            align="center"
                        >
                            <Box flex="1" pr={4}>
                                <Text fontWeight="bold" fontSize="md" color="gray.800" mb={1}>
                                    {data.project.title}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    {data.project.description || 'No description provided.'}
                                </Text>
                            </Box>

                            <Box flex="1">
                                <Wrap spacing={2}>
                                    {data.members.length > 0 ? (
                                        data.members.map(member => (
                                            <WrapItem key={member._id}>
                                                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                                                    <Avatar name={member.name} size="xs" ml={-1} mr={2} />
                                                    <TagLabel textTransform="uppercase">{member.name}</TagLabel>
                                                </Tag>
                                            </WrapItem>
                                        ))
                                    ) : (
                                        <Text fontSize="sm" color="gray.400" fontStyle="italic">Unassigned</Text>
                                    )}
                                </Wrap>
                            </Box>
                        </Flex>
                    ))}

                    {/* Pagination */}
                    <Box px={6} py={4} borderTopWidth={1} borderColor="gray.200">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages || 1}
                            onPageChange={setCurrentPage}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            totalItems={totalItems}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default TeamList;
