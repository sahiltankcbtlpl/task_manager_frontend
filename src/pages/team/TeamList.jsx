import React, { useEffect, useState, useMemo } from 'react';
import { Box, Heading, Flex, useToast, Text } from '@chakra-ui/react';
import { FiUsers } from 'react-icons/fi';
import { getProjectById } from '../../api/project.api';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/feedback/EmptyState';
import Loader from '../../components/common/Loader';
import { useProject } from '../../context/ProjectContext';

const TeamList = () => {
    const { activeProjectId } = useProject();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectTitle, setProjectTitle] = useState('');
    const toast = useToast();

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (!activeProjectId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const projectData = await getProjectById(activeProjectId);
                setMembers(projectData.members || []);
                setProjectTitle(projectData.title || '');
            } catch (error) {
                console.error("Failed to fetch project details for team view", error);
                toast({
                    title: 'Error formatting team',
                    description: 'Could not load active project team.',
                    status: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, [activeProjectId, toast]);

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
                    <Heading size="lg">Team</Heading>
                    {projectTitle && (
                        <Text color="gray.500" mt={1}>
                            Members of project: <strong>{projectTitle}</strong>
                        </Text>
                    )}
                </Box>
            </Flex>

            {!activeProjectId ? (
                <EmptyState title="No Active Project" description="Please select an active project from the header to view its team." icon={FiUsers} />
            ) : loading ? (
                <Loader />
            ) : members.length === 0 ? (
                <EmptyState title="Empty Team" description="There are no team members assigned to this project." icon={FiUsers} />
            ) : (
                <DataTable
                    columns={columns}
                    data={members}
                    isLoading={loading}
                // Since it's just a view list, we don't strictly need pagination if lists are small, 
                // but we can pass dummy pagination to re-use DataTable cleanly if needed.
                // Empty object turns off pagination in our standard DataTable implementation.
                />
            )}
        </Box>
    );
};

export default TeamList;
