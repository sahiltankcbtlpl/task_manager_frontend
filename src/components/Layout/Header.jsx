import { Flex, IconButton, Text, Menu, MenuButton, MenuList, MenuItem, Avatar, Box, useDisclosure, Icon } from '@chakra-ui/react';
import { FiMenu, FiChevronDown, FiUser } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import ProfileModal from './ProfileModal';
import ProjectSelector from './ProjectSelector';
import CompanySelector from './CompanySelector';

const Header = ({ onOpenSidebar }) => {
    const { user, logout } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Flex
            as="header"
            w="full"
            h="80px"
            bg="whiteAlpha.800"
            backdropFilter="blur(10px)"
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

                <Box display={{ base: 'none', md: 'block' }}>
                    <CompanySelector />
                </Box>

                {/* Project Selector Component inserted here */}
                <Box display={{ base: 'none', md: 'block' }}>
                    <ProjectSelector />
                </Box>
            </Flex>

            <Flex align="center">
                <Menu>
                    <MenuButton as={Box} cursor="pointer">
                        <Flex 
                            align="center" 
                            bg="white" 
                            px={3} 
                            py={1.5} 
                            borderRadius="full" 
                            shadow="sm" 
                            border="1px solid" 
                            borderColor="gray.100"
                            _hover={{ shadow: 'md', borderColor: 'brand.200' }}
                            transition="all 0.2s"
                        >
                            <Avatar size="sm" name={user?.name || 'User'} src={user?.avatar} mr={3} border="2px solid white" />
                            <Box display={{ base: 'none', md: 'block' }} mr={3}>
                                <Text fontWeight="bold" fontSize="sm" color="gray.700" lineHeight="1">{user?.name}</Text>
                                <Text fontSize="xs" color="gray.400" mt={0.5}>Account Settings</Text>
                            </Box>
                            <Icon as={FiChevronDown} color="gray.400" />
                        </Flex>
                    </MenuButton>
                    <MenuList borderRadius="xl" shadow="2xl" border="none" py={2}>
                        <MenuItem icon={<FiUser />} onClick={onOpen} _hover={{ bg: 'brand.50', color: 'brand.700' }} py={2.5}>Profile</MenuItem>
                        <MenuItem onClick={logout} _hover={{ bg: 'red.50', color: 'red.600' }} py={2.5}>Logout</MenuItem>
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
