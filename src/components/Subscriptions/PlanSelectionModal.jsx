import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    HStack,
    Text,
    Box,
    Heading,
    SimpleGrid,
    Icon,
    Divider,
    useToast,
    Badge,
    Switch,
    FormControl,
    FormLabel,
} from '@chakra-ui/react';
import { FiCheck, FiStar, FiZap, FiBox, FiArrowRight } from 'react-icons/fi';
import { getSubscriptions, getSubscriptionUsage } from '../../api/subscription.api';
import { assignPlanToCompany } from '../../api/company.api';
import useAuth from '../../hooks/useAuth';

const PlanCard = ({ plan, onSelect, isLoading, duration, isCurrentPlan }) => {
    const isPopular = plan.isPopular;
    
    // Map string names to icons
    const iconMap = {
        'FiBox': FiBox,
        'FiZap': FiZap,
        'FiStar': FiStar
    };
    const SelectedIcon = iconMap[plan.icon] || FiBox;

    return (
        <Box
            border="2px solid"
            borderColor={isCurrentPlan ? 'brand.500' : (isPopular ? 'brand.200' : 'gray.100')}
            borderRadius="2xl"
            p={6}
            bg="white"
            position="relative"
            transition="all 0.3s"
            _hover={!isCurrentPlan ? { transform: 'translateY(-8px)', shadow: 'xl', borderColor: 'brand.400' } : {}}
            cursor={isCurrentPlan ? 'default' : 'pointer'}
            onClick={() => !isCurrentPlan && onSelect(plan)}
            display="flex"
            flexDirection="column"
            opacity={isCurrentPlan ? 0.9 : 1}
        >
            {isCurrentPlan ? (
                <Badge
                    position="absolute"
                    top="-3"
                    left="50%"
                    transform="translateX(-50%)"
                    colorScheme="green"
                    px={4}
                    py={1}
                    borderRadius="full"
                    variant="solid"
                >
                    Current Plan
                </Badge>
            ) : isPopular && (
                <Badge
                    position="absolute"
                    top="-3"
                    left="50%"
                    transform="translateX(-50%)"
                    colorScheme="brand"
                    px={4}
                    py={1}
                    borderRadius="full"
                    variant="solid"
                >
                    Most Popular
                </Badge>
            )}

            <VStack align="start" spacing={4} flex={1}>
                <HStack>
                    <Icon 
                        as={SelectedIcon} 
                        color={isCurrentPlan ? 'green.500' : (isPopular ? 'brand.500' : 'gray.400')} 
                        fontSize="2xl" 
                    />
                    <Heading size="md">{plan.name}</Heading>
                </HStack>

                <HStack align="baseline">
                    <Text fontSize="4xl" fontWeight="800">
                        ₹{duration === 'Yearly' ? Math.floor(plan.price * 10) : plan.price}
                    </Text>
                    <Text color="gray.500">/{duration === 'Yearly' ? 'yr' : 'mo'}</Text>
                </HStack>

                <Divider />

                <VStack align="start" spacing={3} w="full">
                    {plan.features.map((feature, idx) => (
                        <HStack key={idx} spacing={3}>
                            <Icon as={FiCheck} color="green.500" />
                            <Text fontSize="sm" color="gray.600">
                                {feature.module}: <strong>{Number(feature.limit) === -1 ? 'Unlimited' : feature.limit}</strong>
                            </Text>
                        </HStack>
                    ))}
                </VStack>
            </VStack>

            <Button
                mt={8}
                w="full"
                colorScheme={isCurrentPlan ? 'green' : (isPopular ? 'brand' : 'gray')}
                variant={isCurrentPlan ? 'outline' : (isPopular ? 'solid' : 'outline')}
                rightIcon={!isCurrentPlan && <FiArrowRight />}
                isLoading={isLoading}
                isDisabled={isCurrentPlan}
            >
                {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
            </Button>
        </Box>
    );
};

const PlanSelectionModal = ({ isOpen, onClose }) => {
    const { activeCompany } = useAuth();
    const [plans, setPlans] = useState([]);
    const [currentPlanName, setCurrentPlanName] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectingPlanId, setSelectingPlanId] = useState(null);
    const [duration, setDuration] = useState('Monthly');
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchPlansAndCurrent();
        }
    }, [isOpen]);

    const fetchPlansAndCurrent = async () => {
        try {
            setLoading(true);
            const [plansData, usageData] = await Promise.all([
                getSubscriptions({ status: 'Active' }),
                getSubscriptionUsage().catch(() => ({ planName: '' }))
            ]);
            setPlans(plansData);
            setCurrentPlanName(usageData.planName);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load plans. Please try again.',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan) => {
        setSelectingPlanId(plan._id);
        try {
            await assignPlanToCompany(activeCompany, {
                subscriptionId: plan._id,
                duration: duration
            });
            toast({
                title: 'Welcome to your new plan!',
                description: `Successfully subscribed to the ${plan.name} plan.`,
                status: 'success',
            });
            onClose(); // Close the modal
            window.location.reload(); // Refresh to update all context (sidebar etc)
        } catch (error) {
            toast({
                title: 'Subscription Failed',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
            });
        } finally {
            setSelectingPlanId(null);
        }
    };

    const handleSkip = () => {
        sessionStorage.setItem('skipSubscriptionModal', 'true');
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="6xl" 
            closeOnOverlayClick={false} 
            scrollBehavior="inside"
        >
            <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
            <ModalContent borderRadius="3xl">
                <ModalHeader pt={10} textAlign="center">
                    <VStack spacing={2}>
                        <Heading size="xl" bgGradient="linear(to-r, brand.400, brand.700)" bgClip="text">
                            Unlock Your Team's Potential
                        </Heading>
                        <Text color="gray.500" fontSize="lg" fontWeight="normal">
                            Choose the perfect plan to streamline your workflow.
                        </Text>
                    </VStack>
                </ModalHeader>

                <ModalBody p={10} overflowY="auto" sx={{ touchAction: 'pan-y' }}>
                    <VStack spacing={8} align="stretch">
                        <HStack justify="center" spacing={4}>
                            <Text fontWeight={duration === 'Monthly' ? '700' : 'normal'} color={duration === 'Monthly' ? 'brand.600' : 'gray.500'}>
                                Monthly
                            </Text>
                            <FormControl display="flex" alignItems="center" w="auto">
                                <Switch 
                                    id="duration-toggle" 
                                    colorScheme="brand" 
                                    size="lg"
                                    isChecked={duration === 'Yearly'}
                                    onChange={(e) => setDuration(e.target.checked ? 'Yearly' : 'Monthly')}
                                />
                            </FormControl>
                            <HStack>
                                <Text fontWeight={duration === 'Yearly' ? '700' : 'normal'} color={duration === 'Yearly' ? 'brand.600' : 'gray.500'}>
                                    Yearly
                                </Text>
                                <Badge colorScheme="green" variant="solid" borderRadius="full" fontSize="2xs" px={2}>
                                    Save 20%
                                </Badge>
                            </HStack>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                            {plans.length > 0 ? (
                                plans.map((plan) => (
                                    <PlanCard
                                        key={plan._id}
                                        plan={plan}
                                        onSelect={handleSelectPlan}
                                        isLoading={selectingPlanId === plan._id}
                                        duration={duration}
                                        isCurrentPlan={plan.name === currentPlanName}
                                    />
                                ))
                            ) : (
                                <Box textAlign="center" py={10} w="full">
                                    <Text color="gray.500">No active plans found. Please contact an administrator.</Text>
                                </Box>
                            )}
                        </SimpleGrid>
                    </VStack>
                </ModalBody>

                <ModalFooter pb={8} justifyContent="center">
                    <Button variant="ghost" color="gray.400" _hover={{ color: 'gray.600', bg: 'transparent' }} onClick={handleSkip}>
                        I'll do this later, take me to dashboard
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default PlanSelectionModal;
