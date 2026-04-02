import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useToast } from '@chakra-ui/react';
import EmptyState from '../../components/feedback/EmptyState';
import { FiActivity } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { getTasks } from '../../api/task.api';
import useSocket from '../../hooks/useSocket';
import Loader from '../../components/common/Loader';
import { useProject } from '../../context/ProjectContext';

const Dashboard = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { activeProjectId } = useProject();
    const socket = useSocket();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const params = {};
                if (activeProjectId) params.project = activeProjectId;

                const tasks = await getTasks(params);
                const total = tasks.length;

                // Group by Task Status Name
                const statusCounts = tasks.reduce((acc, task) => {
                    const statusName = task.taskStatus?.name || 'Unknown';
                    acc[statusName] = (acc[statusName] || 0) + 1;
                    return acc;
                }, {});

                const dynamicStats = [
                    { label: 'Total Tasks', value: total, helpText: 'All tasks' },
                    ...Object.entries(statusCounts).map(([name, count]) => ({
                        label: name,
                        value: count,
                        helpText: 'Current count'
                    }))
                ];

                setStats(dynamicStats);
            } catch (error) {
                toast({
                    title: 'Failed to load stats',
                    description: error.message,
                    status: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        if (socket) {
            const handleTaskCreated = (data) => {
                console.log('Socket event received: taskCreated', data);
                fetchStats();
            };
            const handleTaskUpdated = (data) => {
                console.log('Socket event received: taskUpdated', data);
                fetchStats();
            };
            const handleTaskDeleted = (data) => {
                console.log('Socket event received: taskDeleted', data);
                fetchStats();
            };

            socket.on('taskCreated', handleTaskCreated);
            socket.on('taskUpdated', handleTaskUpdated);
            socket.on('taskDeleted', handleTaskDeleted);

            return () => {
                socket.off('taskCreated', handleTaskCreated);
                socket.off('taskUpdated', handleTaskUpdated);
                socket.off('taskDeleted', handleTaskDeleted);
            };
        }
    }, [toast, activeProjectId, socket]);

    if (loading) return <Loader type="card" />;

    return (
        <Box>
            <Heading mb={6} size="lg">Dashboard </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                {stats.map((stat, index) => (
                    <Box key={index} p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
                        <Stat>
                            <StatLabel color="gray.500">{stat.label}</StatLabel>
                            <StatNumber fontSize="3xl">{stat.value}</StatNumber>
                            <StatHelpText>{stat.helpText}</StatHelpText>
                        </Stat>
                    </Box>
                ))}
            </SimpleGrid>

            <Heading size="md" mb={4}>Recent Activity</Heading>
            <Box bg="white" p={4} borderRadius="md" shadow="sm">
                <EmptyState title="No recent activity" description="Activity logs will appear here." icon={FiActivity} />
            </Box>
        </Box>
    );
};

export default Dashboard;
