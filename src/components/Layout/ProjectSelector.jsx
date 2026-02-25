import React, { useEffect, useState } from 'react';
import {
    Box, Flex, Text, Icon, Spinner,
    Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverHeader
} from '@chakra-ui/react';
import { FiFolder, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../../api/project.api';
import { ROUTES } from '../../config/routes.config';
import { useProject } from '../../context/ProjectContext';

const ProjectSelector = () => {
    const navigate = useNavigate();
    const { activeProjectId, setActiveProjectId } = useProject();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await getProjects({});
                setProjects(data);
                if (data.length > 0 && !activeProjectId) {
                    // Default to first project if none selected
                    setActiveProjectId(data[0]._id);
                }
            } catch (error) {
                console.error("Failed to fetch projects for selector", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [activeProjectId]);

    const handleSelectProject = (id) => {
        setActiveProjectId(id);
    };

    const activeProject = projects.find(p => p._id === activeProjectId) || projects[0];

    return (
        <Popover placement="bottom-start">
            {({ isOpen, onClose }) => (
                <>
                    <PopoverTrigger>
                        <Flex
                            align="center"
                            cursor="pointer"
                            bg={isOpen ? "blue.50" : "transparent"}
                            _hover={{ bg: "gray.50" }}
                            px={3}
                            py={2}
                            borderRadius="md"
                            transition="all 0.2s"
                        >
                            <Flex align="center" justify="center" bg="blue.50" color="blue.500" p={2} borderRadius="md" mr={3}>
                                <Icon as={FiFolder} boxSize={4} />
                            </Flex>
                            <Box mr={2}>
                                <Text fontWeight="bold" fontSize="sm" color="blue.600" lineHeight="1.2">
                                    {loading ? <Spinner size="xs" /> : (activeProject?.title || "Select Project")}
                                </Text>
                            </Box>
                            <Icon as={isOpen ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={4} />
                        </Flex>
                    </PopoverTrigger>

                    <PopoverContent width="320px" boxShadow="xl" border="none" borderRadius="xl" overflow="hidden">
                        <PopoverHeader borderBottom="none" pt={4} pb={2} px={4}>
                            <Flex justify="space-between" align="center">
                                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                                    Available Projects
                                </Text>
                            </Flex>
                        </PopoverHeader>
                        <PopoverBody p={0} maxH="300px" overflowY="auto">
                            {loading ? (
                                <Flex justify="center" p={4}><Spinner size="sm" color="blue.500" /></Flex>
                            ) : projects.length === 0 ? (
                                <Text p={4} fontSize="sm" color="gray.500" textAlign="center">No projects available.</Text>
                            ) : (
                                projects.map(project => {
                                    const isActive = project._id === activeProjectId;
                                    return (
                                        <Box
                                            key={project._id}
                                            p={3}
                                            px={4}
                                            cursor="pointer"
                                            bg={isActive ? "blue.50" : "transparent"}
                                            borderLeft="4px solid"
                                            borderColor={isActive ? "blue.500" : "transparent"}
                                            _hover={{ bg: isActive ? "blue.50" : "gray.50" }}
                                            onClick={() => {
                                                handleSelectProject(project._id);
                                                onClose();
                                            }}
                                        >
                                            <Text fontWeight="bold" fontSize="sm" color={isActive ? "blue.600" : "gray.800"}>
                                                {project.title}
                                            </Text>
                                            <Text fontSize="xs" color="gray.400" noOfLines={1}>
                                                {project.description || "No description available"}
                                            </Text>
                                        </Box>
                                    );
                                })
                            )}
                        </PopoverBody>
                    </PopoverContent>
                </>
            )}
        </Popover>
    );
};

export default ProjectSelector;
