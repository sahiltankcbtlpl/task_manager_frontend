import { Flex, IconButton, Text, Menu, MenuButton, MenuList, MenuItem, Avatar, Box, useDisclosure } from '@chakra-ui/react';
import { FiMenu, FiChevronDown, FiUser } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import ProfileModal from './ProfileModal';

const Header = ({ onOpenSidebar }) => {
    const { user, logout } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Flex
            as="header"
            w="full"
            h="60px"
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            align="center"
            justify="space-between"
            px={4}
            position="sticky"
            top="0"
            zIndex="banner"
        >
            <IconButton
                icon={<FiMenu />}
                aria-label="Open Menu"
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpenSidebar}
                variant="ghost"
            />

            <Text fontSize="lg" fontWeight="semibold" ml={{ base: 2, md: 0 }}>
                {/* Page Title could be dynamic here */}
            </Text>

            <Flex align="center">
                <Menu>
                    <MenuButton as={Box} cursor="pointer">
                        <Flex align="center">
                            <Avatar size="sm" name={user?.name || 'User'} src={user?.avatar} mr={2} />
                            <Text display={{ base: 'none', md: 'block' }} mr={2}>{user?.name}</Text>
                            <FiChevronDown />
                        </Flex>
                    </MenuButton>
                    <MenuList>
                        <MenuItem icon={<FiUser />} onClick={onOpen}>Profile</MenuItem>
                        <MenuItem onClick={logout}>Logout</MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
            <ProfileModal isOpen={isOpen} onClose={onClose} />
        </Flex>
    );
};

Header.propTypes = {
    onOpenSidebar: PropTypes.func,
};

export default Header;
