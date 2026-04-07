import React, { useState, useEffect } from 'react';
import { Box, Drawer, DrawerContent, useDisclosure, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import PlanSelectionModal from '../Subscriptions/PlanSelectionModal';
import { getSubscriptionUsage } from '../../api/subscription.api';
import useAuth from '../../hooks/useAuth';


const MainLayout = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { user, activeCompany } = useAuth();
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

    useEffect(() => {
        const handleOpenModal = () => setIsPlanModalOpen(true);
        window.addEventListener('open-subscription-modal', handleOpenModal);

        const checkSubscription = async () => {
            if (!activeCompany || !user) return;
            const role = typeof user.role === 'string' ? user.role : (user.role?.name || '');
            const roleLower = role.toLowerCase();
            
            console.log('--- SUBSCRIPTION CHECK ---', { role, roleLower });
            if (!roleLower.includes('owner')) return;

            // Check if skipped in this session (temporarily disabled for testing)
            // if (sessionStorage.getItem('skipSubscriptionModal') === 'true') return;

            try {
                const usage = await getSubscriptionUsage();
                // If company has no plan, usage.status will be 'None' or usage.planName will be 'No Plan'
                if (usage.status === 'None' || usage.planName === 'No Plan' || !usage.planName) {
                    setIsPlanModalOpen(true);
                }
            } catch (error) {
                console.error('Failed to check subscription status:', error);
            }
        };

        checkSubscription();

        return () => {
            window.removeEventListener('open-subscription-modal', handleOpenModal);
        };
    }, [activeCompany, user]);

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            {/* Sidebar for Desktop */}
            <Sidebar
                onClose={() => onClose}
                display={{ base: 'none', md: 'block' }}
            />

            {/* Sidebar for Mobile */}
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full"
            >
                <DrawerContent>
                    <Sidebar onClose={onClose} />
                </DrawerContent>
            </Drawer>

            {/* Content Wrapper */}
            <Box ml={{ base: 0, md: '250px' }} transition=".3s ease">
                <Header onOpen={onOpen} onOpenSidebar={onOpen} />

                <Box p="4">
                    <Outlet />
                </Box>
            </Box>

            {/* Global Subscription Selection Modal */}
            <PlanSelectionModal 
                isOpen={isPlanModalOpen} 
                onClose={() => setIsPlanModalOpen(false)} 
            />
        </Box>
    );
};

export default MainLayout;
