import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    HStack,
    IconButton,
    Heading,
    Text,
    useToast,
    Divider,
    SimpleGrid,
    NumberInput,
    NumberInputField,
    Flex,
    Badge,
    Switch as ChakraSwitch,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { createSubscription, getSubscriptionById, updateSubscription } from '../../api/subscription.api';
import { getModules, createModule, deleteModule as deleteModuleApi } from '../../api/module.api';
import ReactSelect from 'react-select';
import { ROUTES } from '../../config/routes.config';

// DURATION_OPTIONS preserved as constant
const DURATION_OPTIONS = ['Monthly', 'Quarterly', 'Yearly'];

const SubscriptionForm = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const toast = useToast();

    const [formDate, setFormDate] = useState({
        name: '',
        duration: 'Monthly',
        price: '',
        status: 'Active',
        isPopular: false,
        icon: 'FiBox',
    });

    const [features, setFeatures] = useState([]);
    const [newFeature, setNewFeature] = useState({ module: '', limit: 0 });
    const [allModules, setAllModules] = useState([]);
    const [newModuleName, setNewModuleName] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isSubmittingModule, setIsSubmittingModule] = useState(false);

    const fetchModules = async () => {
        try {
            const data = await getModules();
            setAllModules(data);
            return data;
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch modules', status: 'error' });
            return [];
        }
    };

    useEffect(() => {
        if (fetching) return;
        const available = allModules.filter(m => !features.some(f => f.module === m.name));
        // Only reset if currently selected module is no longer available
        if (newFeature.module && !available.some(m => m.name === newFeature.module)) {
            setNewFeature(prev => ({ ...prev, module: '' }));
        }
    }, [features, fetching, allModules]);

    useEffect(() => {
        const initialize = async () => {
            const currentModules = await fetchModules();
            if (isEdit) {
                try {
                    const data = await getSubscriptionById(id);
                    setFormDate({
                        name: data.name,
                        duration: data.duration,
                        price: data.price,
                        status: data.status,
                        isPopular: data.isPopular || false,
                        icon: data.icon || 'FiBox',
                    });
                    setFeatures(data.features || []);
                } catch (error) {
                    toast({
                        title: 'Error',
                        description: 'Failed to fetch subscription details',
                        status: 'error',
                    });
                    navigate(ROUTES.SUBSCRIPTIONS);
                }
            } else if (currentModules.length > 0) {
                setNewFeature(prev => ({ ...prev, module: '' }));
            }
            setFetching(false);
        };
        initialize();
    }, [id, isEdit, navigate, toast]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormDate(prev => ({ ...prev, [name]: value }));
    };

    const handleAddFeatureToList = () => {
        if (!newFeature.module) return;
        if (newFeature.limit < -1) {
            toast({ title: 'Error', description: 'Limit cannot be less than -1', status: 'error' });
            return;
        }
        
        // When editing, allow the same module name for the current item
        const exists = features.some((f, idx) => f.module === newFeature.module && idx !== editingIndex);
        if (exists) {
            toast({ title: 'Info', description: 'This module is already in the list', status: 'info' });
            return;
        }

        if (editingIndex !== null) {
            const updatedFeatures = [...features];
            updatedFeatures[editingIndex] = { ...newFeature };
            setFeatures(updatedFeatures);
            setEditingIndex(null);
        } else {
            setFeatures([...features, { ...newFeature }]);
        }
        
        setNewFeature({ module: '', limit: 0 });
    };

    const handleEditFeature = (index) => {
        setNewFeature({ ...features[index] });
        setEditingIndex(index);
    };

    const handleCreateModule = async () => {
        if (!newModuleName.trim()) return;
        setIsSubmittingModule(true);
        try {
            await createModule({ name: newModuleName.trim() });
            toast({ title: 'Success', description: 'Module added to system', status: 'success' });
            setNewModuleName('');
            await fetchModules();
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to add module', status: 'error' });
        } finally {
            setIsSubmittingModule(false);
        }
    };

    const handleDeleteModule = async (moduleId) => {
        try {
            await deleteModuleApi(moduleId);
            toast({ title: 'Success', description: 'Module removed from system', status: 'success' });
            await fetchModules();
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to remove module', status: 'error' });
        }
    };

    const removeFeature = (index) => {
        if (features.length === 1) {
            toast({
                title: 'Info',
                description: 'At least one feature is required',
                status: 'info',
            });
            return;
        }
        const newFeatures = features.filter((_, i) => i !== index);
        setFeatures(newFeatures);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formDate,
                features: features.map(f => ({ ...f, limit: Number(f.limit) })),
            };

            if (isEdit) {
                await updateSubscription(id, payload);
                toast({ title: 'Success', description: 'Subscription plan updated', status: 'success' });
            } else {
                await createSubscription(payload);
                toast({ title: 'Success', description: 'Subscription plan created', status: 'success' });
            }
            navigate(ROUTES.SUBSCRIPTIONS);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Box p={8} textAlign="center">Loading...</Box>;

    return (
        <Box maxW="800px" mx="auto" p={4}>
            <Button
                leftIcon={<FiArrowLeft />}
                variant="ghost"
                mb={6}
                onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
            >
                Back to Plans
            </Button>

            <Heading size="lg" mb={8}>{isEdit ? 'Edit' : 'Create'} Subscription Plan</Heading>

            <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch" bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Plan Name</FormLabel>
                            <Input
                                name="name"
                                value={formDate.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Gold Plan"
                                focusBorderColor="brand.500"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Duration</FormLabel>
                            <Select
                                name="duration"
                                value={formDate.duration}
                                onChange={handleInputChange}
                                focusBorderColor="brand.500"
                            >
                                {DURATION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Price (₹)</FormLabel>
                            <NumberInput
                                value={formDate.price}
                                onChange={(val) => setFormDate(prev => ({ ...prev, price: val }))}
                                min={0}
                                focusBorderColor="brand.500"
                            >
                                <NumberInputField placeholder="0.00" />
                            </NumberInput>
                        </FormControl>

                        {isEdit && (
                            <FormControl isRequired>
                                <FormLabel fontWeight="600">Status</FormLabel>
                                <Select
                                    name="status"
                                    value={formDate.status}
                                    onChange={handleInputChange}
                                    focusBorderColor="brand.500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </Select>
                            </FormControl>
                        )}

                        <FormControl display="flex" alignItems="center" pt={8}>
                            <FormLabel htmlFor="is-popular" mb="0" fontWeight="600">
                                Most Popular?
                            </FormLabel>
                            <ChakraSwitch 
                                id="is-popular" 
                                colorScheme="brand" 
                                isChecked={formDate.isPopular}
                                onChange={(e) => setFormDate(prev => ({ ...prev, isPopular: e.target.checked }))}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Plan Icon</FormLabel>
                            <Select
                                name="icon"
                                value={formDate.icon}
                                onChange={handleInputChange}
                                focusBorderColor="brand.500"
                            >
                                <option value="FiBox">Box (Basic)</option>
                                <option value="FiZap">Lightning (Premium)</option>
                                <option value="FiStar">Star (Pro)</option>
                            </Select>
                        </FormControl>
                    </SimpleGrid>

                    <Divider />

                    <Box>
                        <Heading size="md" mb={4}>Add Features</Heading>
                        
                        {/* Module Management Entry */}
                        <HStack spacing={2} mb={4}>
                            <FormControl>
                                <Input 
                                    placeholder="Add new system module (e.g. Inventory)" 
                                    value={newModuleName}
                                    onChange={(e) => setNewModuleName(e.target.value)}
                                    size="sm"
                                    focusBorderColor="brand.500"
                                />
                            </FormControl>
                            <Button 
                                size="sm" 
                                colorScheme="green" 
                                leftIcon={<FiPlus />} 
                                onClick={handleCreateModule}
                                isLoading={isSubmittingModule}
                                px={4}
                            >
                                Add Module
                            </Button>
                        </HStack>

                        {/* Entry Row */}
                        <HStack spacing={4} mb={6} p={4} bg="gray.50" borderRadius="md" align="flex-end">
                            <FormControl flex={2}>
                                <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase">Module</FormLabel>
                                <HStack spacing={2}>
                                    <Box flex={1}>
                                        <ReactSelect
                                            placeholder="Select module"
                                            value={newFeature.module ? { value: newFeature.module, label: newFeature.module } : null}
                                            onChange={(selected) => setNewFeature({ ...newFeature, module: selected ? selected.value : '' })}
                                            options={allModules
                                                .filter(m => !features.some((f, idx) => f.module === m.name && idx !== editingIndex))
                                                .map(m => ({ value: m.name, label: m.name }))
                                            }
                                            isDisabled={editingIndex === null && allModules.filter(m => !features.some(f => f.module === m.name)).length === 0}
                                            menuPlacement="bottom"
                                            isClearable
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    borderColor: state.isFocused ? '#3182ce' : '#E2E8F0',
                                                    boxShadow: state.isFocused ? '0 0 0 1px #3182ce' : 'none',
                                                    '&:hover': {
                                                        borderColor: '#CBD5E0'
                                                    },
                                                    borderRadius: '0.375rem',
                                                    minHeight: '40px',
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    color: '#A0AEC0',
                                                    fontSize: '0.875rem'
                                                })
                                            }}
                                        />
                                    </Box>
                                    
                                    {/* System Module Delete Option */}
                                    {newFeature.module && (
                                        <IconButton
                                            icon={<FiTrash2 />}
                                            colorScheme="red"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const mod = allModules.find(m => m.name === newFeature.module);
                                                if (mod) handleDeleteModule(mod._id);
                                            }}
                                            aria-label="Remove module from system"
                                            title="Remove module from system permanently"
                                        />
                                    )}
                                </HStack>
                            </FormControl>

                            <FormControl flex={1}>
                                <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase">Limit</FormLabel>
                                <NumberInput
                                    value={newFeature.limit}
                                    onChange={(val) => setNewFeature({ ...newFeature, limit: val })}
                                    min={-1}
                                    focusBorderColor="brand.500"
                                    bg="white"
                                >
                                    <NumberInputField placeholder="-1 for Unlimited" />
                                </NumberInput>
                            </FormControl>

                            <Button
                                leftIcon={editingIndex !== null ? <FiPlus /> : <FiPlus />}
                                colorScheme={editingIndex !== null ? 'orange' : 'brand'}
                                onClick={handleAddFeatureToList}
                                px={6}
                                isDisabled={!newFeature.module || (editingIndex === null && allModules.filter(m => !features.some(f => f.module === m.name)).length === 0)}
                            >
                                {editingIndex !== null ? 'Update' : 'Add'}
                            </Button>
                            {editingIndex !== null && (
                                <Button 
                                    variant="ghost" 
                                    onClick={() => {
                                        setEditingIndex(null);
                                        setNewFeature({ module: '', limit: 0 });
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </HStack>

                        {/* List Below */}
                        {features.length > 0 ? (
                            <VStack spacing={2} align="stretch">
                                <Text fontSize="sm" fontWeight="600" color="gray.500" mb={1}>Added Features:</Text>
                                {features.map((feature, index) => (
                                    <HStack 
                                        key={index} 
                                        p={3} 
                                        bg="white" 
                                        border="1px" 
                                        borderColor="gray.200" 
                                        borderRadius="md" 
                                        justify="space-between"
                                        _hover={{ borderColor: 'brand.200', bg: 'brand.50' }}
                                        transition="all 0.2s"
                                    >
                                        <HStack spacing={4}>
                                            <Badge colorScheme="brand" variant="subtle" px={2} py={1}>
                                                {feature.module}
                                            </Badge>
                                            <Text fontWeight="600" fontSize="sm">Limit: {feature.limit === -1 ? 'Unlimited' : feature.limit}</Text>
                                        </HStack>
                                        <HStack spacing={1}>
                                            <IconButton
                                                icon={<FiEdit2 />}
                                                colorScheme="brand"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditFeature(index)}
                                                aria-label="Edit feature"
                                            />
                                            <IconButton
                                                icon={<FiTrash2 />}
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFeature(index)}
                                                aria-label="Remove feature"
                                            />
                                        </HStack>
                                    </HStack>
                                ))}
                            </VStack>
                        ) : (
                            <Box textAlign="center" py={4} border="1px dashed" borderColor="gray.300" borderRadius="md">
                                <Text color="gray.400" fontSize="sm">No features added yet.</Text>
                            </Box>
                        )}
                    </Box>

                    <Flex justify="flex-start" mt={4} gap={4}>
                        <Button
                            type="submit"
                            colorScheme="brand"
                            size="lg"
                            px={10}
                            isLoading={loading}
                            loadingText="Saving..."
                        >
                            {isEdit ? 'Update' : 'Create'} Plan
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                            isDisabled={loading}
                        >
                            Cancel
                        </Button>
                    </Flex>
                </VStack>
            </form>
        </Box>
    );
};

export default SubscriptionForm;
