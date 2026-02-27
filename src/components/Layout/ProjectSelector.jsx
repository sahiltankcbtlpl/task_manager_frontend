import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader
} from '@chakra-ui/react';
import { FiFolder, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getProjects } from '../../api/project.api';
import { useProject } from '../../context/ProjectContext';

const ProjectSelector = () => {
  const { activeProjectId, setActiveProjectId } = useProject();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------------- data fetching ---------------------------- */
  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      try {
        const data = await getProjects({});
        if (!mounted) return;

        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects for selector', err);
      } finally {
        mounted && setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-select the first project if none is active
  useEffect(() => {
    // Optionally remove auto-select so "All Projects" is default
    // Or keep it if desired; based on requirements we want "All Projects"
    // to be selectable. If we want "All Projects" to be default on login:
    if (activeProjectId === undefined) {
      setActiveProjectId(null); // Explicitly null means "All Projects"
    }
  }, [activeProjectId, setActiveProjectId]);

  /* ---------------------------- derived state ----------------------------- */
  const activeProject = useMemo(
    () => activeProjectId ? projects.find(p => p._id === activeProjectId) : null,
    [projects, activeProjectId]
  );

  /* ------------------------------ handlers -------------------------------- */
  const handleSelectProject = (id, onClose) => {
    setActiveProjectId(id);
    onClose();
  };

  /* -------------------------------- render -------------------------------- */
  return (
    <Popover placement="bottom-start">
      {({ isOpen, onClose }) => (
        <>
          {/* ========================= Trigger ========================= */}
          <PopoverTrigger>
            <Flex
              align="center"
              cursor="pointer"
              px={3}
              py={2}
              borderRadius="md"
              bg={isOpen ? 'blue.50' : 'transparent'}
              _hover={{ bg: 'gray.50' }}
              transition="all 0.2s"
            >
              {/* Icon */}
              <Flex
                align="center"
                justify="center"
                bg="blue.50"
                color="blue.500"
                p={2}
                borderRadius="md"
                mr={3}
              >
                <Icon as={FiFolder} boxSize={4} />
              </Flex>

              {/* Title */}
              <Box mr={2}>
                <Flex align="center">
                  <Text
                    as="span"
                    fontWeight="bold"
                    fontSize="sm"
                    color="blue.600"
                  >
                    {loading
                      ? 'Loading'
                      : activeProject ? activeProject.title : 'All Projects'}
                  </Text>

                  {loading && (
                    <Spinner size="xs" ml={2} color="blue.500" />
                  )}
                </Flex>
              </Box>

              {/* Chevron */}
              <Icon
                as={isOpen ? FiChevronUp : FiChevronDown}
                boxSize={4}
                color="blue.500"
              />
            </Flex>
          </PopoverTrigger>

          {/* ========================= Content ========================= */}
          <PopoverContent
            w="320px"
            border="none"
            borderRadius="xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <PopoverHeader pt={4} pb={2} px={4} borderBottom="none">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Available Projects
              </Text>
            </PopoverHeader>

            <PopoverBody p={0} maxH="300px" overflowY="auto">
              {loading && (
                <Flex justify="center" p={4}>
                  <Spinner size="sm" color="blue.500" />
                </Flex>
              )}

              {!loading && projects.length === 0 && (
                <Text p={4} fontSize="sm" color="gray.500" textAlign="center">
                  No projects available.
                </Text>
              )}

              {!loading && (
                <>
                  <Box
                    px={4}
                    py={3}
                    cursor="pointer"
                    bg={!activeProjectId ? 'blue.50' : 'transparent'}
                    borderLeft="4px solid"
                    borderColor={!activeProjectId ? 'blue.500' : 'transparent'}
                    _hover={{ bg: !activeProjectId ? 'blue.50' : 'gray.50' }}
                    onClick={() => handleSelectProject(null, onClose)}
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color={!activeProjectId ? 'blue.600' : 'gray.800'}
                    >
                      All Projects
                    </Text>
                  </Box>

                  {projects.map(project => {
                    const isActive = project._id === activeProjectId;

                    return (
                      <Box
                        key={project._id}
                        px={4}
                        py={3}
                        cursor="pointer"
                        bg={isActive ? 'blue.50' : 'transparent'}
                        borderLeft="4px solid"
                        borderColor={isActive ? 'blue.500' : 'transparent'}
                        _hover={{ bg: isActive ? 'blue.50' : 'gray.50' }}
                        onClick={() =>
                          handleSelectProject(project._id, onClose)
                        }
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color={isActive ? 'blue.600' : 'gray.800'}
                        >
                          {project.title}
                        </Text>

                        <Text fontSize="xs" color="gray.400" noOfLines={1}>
                          {project.description || 'No description available'}
                        </Text>
                      </Box>
                    );
                  })}
                </>
              )}
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

export default ProjectSelector;