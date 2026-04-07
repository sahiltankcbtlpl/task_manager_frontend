import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Progress,
    Card,
    CardHeader,
    CardBody,
    Badge,
    Icon,
    HStack,
    Button,
    useToast,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { 
    FiPackage, 
    FiCalendar, 
    FiActivity, 
    FiArrowRight, 
    FiPlusCircle 
} from 'react-icons/fi';
import { getSubscriptionUsage } from '../../api/subscription.api';
import useAuth from '../../hooks/useAuth';
import PlanSelectionModal from '../../components/Subscriptions/PlanSelectionModal';
import { useDisclosure } from '@chakra-ui/react';

const CompanySubscription = () => {
    const { activeCompany } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const data = await getSubscriptionUsage();
                setUsageData(data);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load subscription details',
                    status: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        if (activeCompany) {
            fetchUsage();
        }
    }, [activeCompany, toast]);

    if (loading) return <Box p={8} textAlign="center">Loading subscription details...</Box>;

    if (!usageData || !usageData.usage || usageData.usage.length === 0) {
        return (
            <Box p={8}>
                <VStack spacing={6} align="stretch">
                    <Alert status="info" borderRadius="xl" py={6} variant="subtle">
                        <AlertIcon boxSize="20px" mr={4} />
                        <Box>
                            <AlertTitle fontSize="lg">No Active Subscription Found</AlertTitle>
                            <AlertDescription>
                                Your company is currently running on the default internal plan.
                                Subscribe to a tailored plan to increase your limits and unlock more features.
                            </AlertDescription>
                        </Box>
                    </Alert>
                    
                    <Box textAlign="center">
                        <Button 
                            leftIcon={<FiPlusCircle />} 
                            colorScheme="brand" 
                            size="lg" 
                            onClick={onOpen}
                        >
                            Enroll in a Plan Now
                        </Button>
                    </Box>
                </VStack>

                <PlanSelectionModal isOpen={isOpen} onClose={onClose} />
            </Box>
        );
    }

    const { planName, status, expiresAt, usage } = usageData;
    const isExpired = status === 'Expired' || (expiresAt && new Date(expiresAt) < new Date());

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <VStack align="stretch" spacing={8}>
                <HStack justify="space-between" align="flex-start">
                    <VStack align="flex-start" spacing={1}>
                        <Heading size="lg">Subscription Management</Heading>
                        <Text color="gray.600">Monitor your plan limits and usage in real-time.</Text>
                    </VStack>
                    <Badge 
                        colorScheme={isExpired ? 'red' : 'green'} 
                        fontSize="md" 
                        px={4} 
                        py={1} 
                        borderRadius="full"
                    >
                        {status}
                    </Badge>
                </HStack>

                {isExpired && (
                    <Alert status="error" borderRadius="lg">
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Subscription Expired!</AlertTitle>
                            <AlertDescription>
                                Your plan expired on {new Date(expiresAt).toLocaleDateString()}. 
                                Some features may be restricted. Please renew to continue.
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Card variant="outline" shadow="sm" borderRadius="xl">
                        <CardBody>
                            <Stat>
                                <HStack mb={2}>
                                    <Icon as={FiPackage} color="brand.500" fontSize="xl" />
                                    <StatLabel fontSize="md" fontWeight="600">Current Plan</StatLabel>
                                </HStack>
                                <StatNumber fontSize="3xl">{planName}</StatNumber>
                                <StatHelpText>Dynamic limits active</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card variant="outline" shadow="sm" borderRadius="xl">
                        <CardBody>
                            <Stat>
                                <HStack mb={2}>
                                    <Icon as={FiCalendar} color="orange.500" fontSize="xl" />
                                    <StatLabel fontSize="md" fontWeight="600">Renewal Date</StatLabel>
                                </HStack>
                                <StatNumber fontSize="2xl">
                                    {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'N/A'}
                                </StatNumber>
                                <StatHelpText>{expiresAt ? 'Plan will expire on this date' : 'Lifetime access'}</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card variant="outline" shadow="sm" borderRadius="xl">
                        <CardBody>
                            <Stat>
                                <HStack mb={2}>
                                    <Icon as={FiActivity} color="green.500" fontSize="xl" />
                                    <StatLabel fontSize="md" fontWeight="600">Overall Status</StatLabel>
                                </HStack>
                                <StatNumber fontSize="2xl">{isExpired ? 'Inactive' : 'Healthy'}</StatNumber>
                                <StatHelpText>{isExpired ? 'Action required' : 'Limits active'}</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                <Card variant="outline" shadow="sm" borderRadius="xl">
                    <CardHeader borderBottom="1px" borderColor="gray.100">
                        <Heading size="md">Plan Usage Breakdown</Heading>
                    </CardHeader>
                    <CardBody>
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} py={4}>
                            {usage.map((item) => {
                                const percentage = (item.current / item.limit) * 100;
                                const isCritical = percentage >= 90;
                                const isWarning = percentage >= 75 && percentage < 90;
                                
                                return (
                                    <Box key={item.module}>
                                        <HStack justify="space-between" mb={2}>
                                            <VStack align="flex-start" spacing={0}>
                                                <Text fontWeight="700" fontSize="md">{item.module}</Text>
                                                <Text fontSize="xs" color="gray.500">Feature Limit: {item.limit === -1 ? 'Unlimited' : item.limit}</Text>
                                            </VStack>
                                            <VStack align="flex-end" spacing={0}>
                                                <Text fontWeight="800" fontSize="xl" color={isCritical && item.limit !== -1 ? 'red.500' : 'gray.800'}>
                                                    {item.current}
                                                </Text>
                                                <Text fontSize="xs" color="gray.400">Used</Text>
                                            </VStack>
                                        </HStack>
                                        {item.limit !== -1 ? (
                                            <>
                                                <Progress 
                                                    value={percentage} 
                                                    size="md" 
                                                    borderRadius="full" 
                                                    colorScheme={isCritical ? 'red' : isWarning ? 'orange' : 'brand'}
                                                    bg="gray.100"
                                                    mb={2}
                                                />
                                                <HStack justify="space-between">
                                                    <Text fontSize="xs" color="gray.500">{percentage.toFixed(0)}% utilized</Text>
                                                    {isCritical && <Text fontSize="xs" color="red.500" fontWeight="bold">Action Required</Text>}
                                                </HStack>
                                            </>
                                        ) : (
                                            <Text fontSize="xs" color="brand.500" fontWeight="600">Enjoy unlimited access to this module.</Text>
                                        )}
                                    </Box>
                                );
                            })}
                        </SimpleGrid>
                    </CardBody>
                </Card>

                <Box textAlign="center" py={4}>
                    <Button 
                        rightIcon={<FiArrowRight />} 
                        variant="solid" 
                        colorScheme="brand"
                        onClick={onOpen}
                        size="lg"
                        boxShadow="md"
                    >
                        Upgrade Your Plan
                    </Button>
                </Box>
            </VStack>

            {/* Subscription Selection Modal */}
            <PlanSelectionModal isOpen={isOpen} onClose={onClose} />
        </Box>
    );
};

export default CompanySubscription;
