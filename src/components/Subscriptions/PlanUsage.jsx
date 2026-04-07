import React, { useState, useEffect } from 'react';
import { 
    Box, 
    VStack, 
    Text, 
    Progress, 
    Badge, 
    Skeleton,
    Tooltip,
    HStack,
    Icon
} from '@chakra-ui/react';
import { FiTriangle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getSubscriptionUsage } from '../../api/subscription.api';
import useAuth from '../../hooks/useAuth';

const PlanUsage = () => {
    const { user, activeCompany } = useAuth();
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = user?.role?.name === 'Super Admin';

    useEffect(() => {
        const fetchUsage = async () => {
            if (!activeCompany) return;
            try {
                const data = await getSubscriptionUsage();
                setUsageData(data);
            } catch (error) {
                console.error('Failed to fetch subscription usage:', error);
            } finally {
                setLoading(false);
            }
        };

        if (activeCompany) {
            fetchUsage();
        }
    }, [activeCompany]);

    if (!activeCompany || isSuperAdmin) return null;

    if (loading) {
        return (
            <VStack align="stretch" spacing={2} p={4} bg="gray.50" borderRadius="lg" mt="auto">
                <Skeleton h="15px" w="60%" />
                <Skeleton h="10px" />
                <Skeleton h="10px" />
            </VStack>
        );
    }

    if (!usageData || !usageData.usage || usageData.usage.length === 0) {
        return (
            <Box p={4} bg="brand.50" borderRadius="lg" mt="auto" border="1px" borderColor="brand.100">
                <Text fontSize="xs" fontWeight="700" color="brand.700" mb={1} textTransform="uppercase">
                    Plan: Unlimited
                </Text>
                <Text fontSize="2xs" color="brand.600">No restrictions applied.</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={3} p={4} bg="gray.50" borderRadius="lg" mt="auto" border="1px" borderColor="gray.100">
            <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase">
                    {usageData.planName}
                </Text>
                <Badge colorScheme={usageData.status === 'Active' ? 'green' : 'red'} variant="subtle" fontSize="2xs">
                    {usageData.status}
                </Badge>
            </HStack>

            {usageData.usage.map((item) => {
                const percentage = (item.current / item.limit) * 100;
                const isNearLimit = percentage >= 80;
                const progressColor = isNearLimit ? 'red' : 'brand';

                return (
                    <Box key={item.module}>
                        <HStack justify="space-between" mb={1}>
                            <Text fontSize="2xs" fontWeight="600" color="gray.600">
                                {item.module}
                            </Text>
                            <Text fontSize="2xs" fontWeight="700" color={isNearLimit ? 'red.500' : 'gray.700'}>
                                {item.limit === -1 ? 'Unlimited' : `${item.current}/${item.limit}`}
                            </Text>
                        </HStack>
                        {item.limit !== -1 && (
                            <Tooltip label={`${item.current} of ${item.limit} used`} placement="top">
                                <Progress 
                                    value={percentage} 
                                    size="xs" 
                                    borderRadius="full" 
                                    colorScheme={progressColor} 
                                    bg="gray.200"
                                />
                            </Tooltip>
                        )}
                    </Box>
                );
            })}

            {usageData.expiresAt && (
                <Text fontSize="2xs" color="gray.400" fontStyle="italic" textAlign="center" mt={1}>
                    Expires: {new Date(usageData.expiresAt).toLocaleDateString()}
                </Text>
            )}
        </VStack>
    );
};

export default PlanUsage;
