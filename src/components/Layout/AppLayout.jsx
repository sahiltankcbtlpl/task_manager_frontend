import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
// import Sidebar from './SidebarNew'; // TEMPORARY: Commented out to resolve casing issue while this file is unused
// import Header from './Header'; // TEMPORARY: Commented out to resolve casing issue while this file is unused
import useAuth from '../../hooks/useAuth';

const AppLayout = () => {
    const { user } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Flex h="100vh" overflow="hidden">
            {/* Sidebar - only show if user is logged in (or maybe always check logic later) */}
            {/* Actually prompt says "Same layout for all pages" but Login usually doesn't have sidebar. 
      However, "ProtectedLayout" usually wraps Dashboard/others.
      Let's assume AppLayout is the main shell.
      Wait, strictly "Layout -> Header, Sidebar, Main content".
      But Login page usually is standalone.
      I'll implement Sidebar and Header here. Use ProtectedLayout to enforce login.
      */}
            {/* <Sidebar isOpen={isOpen} onClose={onClose} display={{ base: isOpen ? 'block' : 'none', md: 'block' }} /> */}

            <Flex direction="column" flex="1" overflow="hidden">
                {/* <Header onOpenSidebar={onOpen} /> */}
                <Box flex="1" overflowY="auto" p={4} bg="gray.50">
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    );
};

export default AppLayout;
