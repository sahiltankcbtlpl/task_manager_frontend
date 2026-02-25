import { Flex, IconButton, Text, Menu, MenuButton, MenuList, MenuItem, Avatar, Box, useDisclosure } from '@chakra-ui/react';
import { FiMenu, FiChevronDown, FiUser } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import ProfileModal from './ProfileModal';
import ProjectSelector from './ProjectSelector';

const Header = ({ onOpenSidebar }) => {
    const { user, logout } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Flex
            as="header"
            w="full"
            h="80px"
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            align="center"
            justify="space-between"
            px={6}
            position="sticky"
            top="0"
            zIndex="banner"
        >
            <Flex align="center">
                <IconButton
                    icon={<FiMenu />}
                    aria-label="Open Menu"
                    display={{ base: 'flex', md: 'none' }}
                    onClick={onOpenSidebar}
                    variant="ghost"
                    mr={4}
                />

                {/* Project Selector Component inserted here */}
                <Box display={{ base: 'none', md: 'block' }}>
                    <ProjectSelector />
                </Box>
            </Flex>

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
