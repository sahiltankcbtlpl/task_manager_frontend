import React, { useState } from 'react';
import { Box, Drawer, DrawerContent, useDisclosure, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

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
        </Box>
    );
};

export default MainLayout;
