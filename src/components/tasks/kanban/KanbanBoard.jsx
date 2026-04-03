import React, { useMemo, useRef, useState } from 'react';
import {
    Box,
    Flex,
    Text,
    Badge,
    VStack,
    HStack,
    Avatar,
    IconButton,
    Tooltip,
    Skeleton,
    Spinner,
    useColorModeValue,
} from '@chakra-ui/react';
import { FiEye, FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import CanAccess from '../../common/CanAccess';

/**
 * KanbanBoard — pure presentational component.
 * All data fetching, state, update, and delete logic lives in the parent (TaskList).
 *
 * Props:
 *  tasks            — array of task objects (current page)
 *  statusOptions    — [{ label, value, project }]
 *  assigneeOptions  — [{ label, value }]
 *  isLoading        — bool
 *  canUpdate        — bool (permission)
 *  isStaff          — bool
 *  currentUser      — user obj
 *  isIssue          — bool
 *  editRouteBase    — string
 *  onViewTask       — fn(task)
 *  onUpdateTask     — fn(id, field, value)
 *  onDeleteTask     — fn(id)
 *  activeProjectId  — string | null
 */
const KanbanBoard = ({
    tasks = [],
    statusOptions = [],
    isLoading = false,
    canUpdate = false,
    isStaff = false,
    currentUser,
    isIssue = false,
    editRouteBase = '',
    onViewTask,
    onUpdateTask,
    onDeleteTask,
    activeProjectId,
}) => {
    const navigate = useNavigate();
    const [draggingId, setDraggingId] = useState(null);
    const [draggingOverCol, setDraggingOverCol] = useState(null);
    const dragTaskRef = useRef(null);

    // ── Derive unique status columns from the statusOptions list ─────────────
    // Deduplicate by lowercase label (same as TaskList's uniqueStatusOptions)
    const columns = useMemo(() => {
        const seen = new Map();
        statusOptions.forEach((opt) => {
            const key = opt.label.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, opt);
        });
        return Array.from(seen.values()); // [{ label, value, project }]
    }, [statusOptions]);

    // Group tasks by taskStatus._id
    const grouped = useMemo(() => {
        const map = {};
        columns.forEach((col) => {
            map[col.value] = [];
        });
        // Tasks whose status isn't in any column go into a special "Uncategorised" bucket
        const uncategorised = [];
        tasks.forEach((task) => {
            const sid = task.taskStatus?._id;
            if (sid && map[sid] !== undefined) {
                map[sid].push(task);
            } else {
                uncategorised.push(task);
            }
        });
        return { grouped: map, uncategorised };
    }, [tasks, columns]);

    // ── Drag-and-drop ────────────────────────────────────────────────────────
    const handleDragStart = (e, task) => {
        dragTaskRef.current = task;
        setDraggingId(task._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        dragTaskRef.current = null;
        setDraggingId(null);
        setDraggingOverCol(null);
    };

    const handleDragOver = (e, colValue) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDraggingOverCol(colValue);
    };

    const handleDrop = (e, colValue) => {
        e.preventDefault();
        const task = dragTaskRef.current;
        if (!task || !canUpdate) return;
        if (task.taskStatus?._id !== colValue) {
            onUpdateTask(task._id, 'taskStatus', colValue);
        }
        handleDragEnd();
    };

    // ── Card colors ──────────────────────────────────────────────────────────
    const cardBg = useColorModeValue('white', 'gray.700');
    const colBg = useColorModeValue('gray.50', 'gray.800');
    const colBorder = useColorModeValue('gray.200', 'gray.600');
    const dragOverBg = useColorModeValue('brand.50', 'brand.900');

    // ── Helpers ──────────────────────────────────────────────────────────────


    // ── Skeleton loading ─────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <Flex gap={4} overflowX="auto" pb={4} align="flex-start">
                {[1, 2, 3].map((i) => (
                    <Box
                        key={i}
                        minW="260px"
                        maxW="300px"
                        flex="0 0 auto"
                        bg={colBg}
                        border="1px solid"
                        borderColor={colBorder}
                        borderRadius="xl"
                        p={4}
                    >
                        <Skeleton height="20px" mb={4} borderRadius="md" />
                        {[1, 2, 3].map((j) => (
                            <Skeleton key={j} height="90px" mb={3} borderRadius="lg" />
                        ))}
                    </Box>
                ))}
            </Flex>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    const renderCard = (task) => {
        const isDragging = draggingId === task._id;

        return (
            <Box
                key={task._id}
                bg={cardBg}
                borderRadius="lg"
                shadow={isDragging ? 'lg' : 'sm'}
                border="1px solid"
                borderColor={isDragging ? 'brand.400' : 'gray.100'}
                p={3}
                mb={3}
                draggable={canUpdate}
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                opacity={isDragging ? 0.5 : 1}
                cursor={canUpdate ? 'grab' : 'default'}
                transition="all 0.15s ease"
                _hover={{ shadow: 'md', borderColor: 'brand.200' }}
                role="group"
            >
                {/* Title */}
                <Text
                    fontWeight="semibold"
                    fontSize="sm"
                    mb={2}
                    noOfLines={2}
                    cursor="pointer"
                    color="brand.600"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => onViewTask(task)}
                >
                    {task.name}
                </Text>



                {/* Footer: assignee avatar + actions */}
                <Flex justify="space-between" align="center" mt={1}>
                    {task.assignee ? (
                        <HStack spacing={1}>
                            <Avatar
                                size="xs"
                                name={task.assignee.name}
                                title={task.assignee.name}
                            />
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                {task.assignee.name}
                            </Text>
                        </HStack>
                    ) : (
                        <Text fontSize="xs" color="gray.400" fontStyle="italic">
                            Unassigned
                        </Text>
                    )}

                    {/* Action icons */}
                    <HStack spacing={1}>
                        <Tooltip label="View Details">
                            <IconButton
                                icon={<FiEye />}
                                aria-label="View"
                                size="xs"
                                variant="ghost"
                                colorScheme="gray"
                                onClick={(e) => { e.stopPropagation(); onViewTask(task); }}
                            />
                        </Tooltip>

                        <CanAccess permission="tasks-update">
                            <Tooltip label="Edit">
                                <IconButton
                                    icon={<FiEdit2 />}
                                    aria-label="Edit"
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`${editRouteBase}/edit/${task._id}`);
                                    }}
                                />
                            </Tooltip>
                        </CanAccess>

                        <CanAccess permission="tasks-delete">
                            <Tooltip label="Delete">
                                <IconButton
                                    icon={<FiTrash2 />}
                                    aria-label="Delete"
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task._id); }}
                                />
                            </Tooltip>
                        </CanAccess>
                    </HStack>
                </Flex>
            </Box>
        );
    };

    const renderColumn = (col) => {
        const colTasks = grouped.grouped[col.value] || [];
        const isOver = draggingOverCol === col.value;

        return (
            <Box
                key={col.value}
                minW="260px"
                maxW="300px"
                flex="0 0 auto"
                bg={isOver ? dragOverBg : colBg}
                border="1px solid"
                borderColor={isOver ? 'brand.400' : colBorder}
                borderRadius="xl"
                p={4}
                transition="background 0.15s ease, border-color 0.15s ease"
                onDragOver={(e) => handleDragOver(e, col.value)}
                onDragLeave={() => setDraggingOverCol(null)}
                onDrop={(e) => handleDrop(e, col.value)}
            >
                {/* Column Header */}
                <HStack justify="space-between" mb={4}>
                    <HStack>
                        <Text fontWeight="bold" fontSize="sm" color="gray.700">
                            {col.label}
                        </Text>
                        <Badge
                            colorScheme="brand"
                            borderRadius="full"
                            fontSize="xs"
                            px={2}
                        >
                            {colTasks.length}
                        </Badge>
                    </HStack>
                </HStack>

                {/* Task Cards */}
                <Box minH="80px">
                    {colTasks.length === 0 ? (
                        <Box
                            textAlign="center"
                            py={6}
                            border="2px dashed"
                            borderColor={isOver ? 'brand.400' : 'gray.200'}
                            borderRadius="lg"
                            transition="border-color 0.15s ease"
                        >
                            <Text fontSize="xs" color="gray.400">
                                Drop tasks here
                            </Text>
                        </Box>
                    ) : (
                        colTasks.map(renderCard)
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Flex gap={4} overflowX="auto" pb={4} align="flex-start">
            {columns.map(renderColumn)}

            {/* Uncategorised column */}
            {grouped.uncategorised.length > 0 && (
                <Box
                    minW="260px"
                    maxW="300px"
                    flex="0 0 auto"
                    bg={colBg}
                    border="1px solid"
                    borderColor={colBorder}
                    borderRadius="xl"
                    p={4}
                >
                    <HStack mb={4}>
                        <Text fontWeight="bold" fontSize="sm" color="gray.500">
                            Uncategorised
                        </Text>
                        <Badge colorScheme="gray" borderRadius="full" fontSize="xs" px={2}>
                            {grouped.uncategorised.length}
                        </Badge>
                    </HStack>
                    {grouped.uncategorised.map(renderCard)}
                </Box>
            )}

            {/* Empty state when no columns exist */}
            {columns.length === 0 && tasks.length === 0 && (
                <Box py={10} textAlign="center" w="full">
                    <Text color="gray.400">No statuses configured. Add a task status first.</Text>
                </Box>
            )}
        </Flex>
    );
};

export default KanbanBoard;
