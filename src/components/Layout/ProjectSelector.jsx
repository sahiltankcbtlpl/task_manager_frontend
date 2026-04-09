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
  const { activeProjectId, setActiveProjectId, projects, loading } = useProject();

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
              py={1.5}
              borderRadius="xl"
              bg={isOpen ? 'brand.50' : 'transparent'}
              _hover={{ bg: 'brand.50', transform: 'translateY(-1px)' }}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              border="1px solid"
              borderColor={isOpen ? 'brand.100' : 'transparent'}
            >
              {/* Icon */}
              <Flex
                align="center"
                justify="center"
                bg="brand.50"
                color="brand.600"
                p={2}
                borderRadius="lg"
                mr={3}
                shadow="sm"
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
                    color="brand.700"
                  >
                    {loading
                      ? 'Loading'
                      : activeProject ? activeProject.title : 'All Projects'}
                  </Text>

                  {loading && (
                    <Spinner size="xs" ml={2} color="brand.500" />
                  )}
                </Flex>
              </Box>

              {/* Chevron */}
              <Icon
                as={isOpen ? FiChevronUp : FiChevronDown}
                boxSize={4}
                color="brand.400"
              />
            </Flex>
          </PopoverTrigger>

          {/* ========================= Content ========================= */}
          <PopoverContent
            w="320px"
            border="none"
            borderRadius="2xl"
            boxShadow="0 10px 40px rgba(0,0,0,0.1)"
            overflow="hidden"
            _focus={{ outline: 'none' }}
          >
            <PopoverHeader pt={5} pb={2} px={4} borderBottom="none">
              <Text
                fontSize="xs"
                fontWeight="extrabold"
                color="brand.600"
                textTransform="uppercase"
                letterSpacing="widest"
              >
                Available Projects
              </Text>
            </PopoverHeader>

            <PopoverBody p={0} maxH="300px" overflowY="auto">
              {loading && (
                <Flex justify="center" p={6}>
                  <Spinner size="md" thickness="3px" color="brand.500" />
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
                    bg={!activeProjectId ? 'brand.50' : 'transparent'}
                    borderLeft="4px solid"
                    borderColor={!activeProjectId ? 'brand.500' : 'transparent'}
                    _hover={{ bg: 'brand.50' }}
                    onClick={() => handleSelectProject(null, onClose)}
                    transition="all 0.2s"
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color={!activeProjectId ? 'brand.700' : 'gray.700'}
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
                        bg={isActive ? 'brand.50' : 'transparent'}
                        borderLeft="4px solid"
                        borderColor={isActive ? 'brand.500' : 'transparent'}
                        _hover={{ bg: 'brand.50' }}
                        onClick={() =>
                          handleSelectProject(project._id, onClose)
                        }
                        transition="all 0.2s"
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color={isActive ? 'brand.700' : 'gray.700'}
                        >
                          {project.title}
                        </Text>

                        <Text fontSize="xs" color="gray.500" noOfLines={1} mt={0.5}>
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