import { Box, VStack, Text, Icon, Collapse, Flex, Tooltip, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ROUTES } from "../../config/routes.config";
import theme from "../../theme/chakra.theme";
import CanAccess from "../common/CanAccess";
import { SIDEBAR_ITEMS } from "../../config/sidebar.config";
import PropTypes from "prop-types";
import useAuth from "../../hooks/useAuth";
import { FiChevronDown, FiChevronUp, FiChevronsLeft, FiChevronsRight, FiMenu } from "react-icons/fi";

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggle, ...props }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({
        Settings: location.pathname.includes('/settings') || location.pathname.includes('company-settings')
    });

    const toggleMenu = (label) => {
        if (isCollapsed) return; // Don't expand menus in collapsed mode
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const isItemVisible = (item) => {
        if (item.ownerOnly) {
            return user?.role === 'Company Owner' || user?.role?.name === 'Company Owner';
        }
        if (item.superAdminOnly) {
            return user?.role === 'Super Admin' || user?.role?.name === 'Super Admin';
        }
        if (item.permission) {
            return true; 
        }
        return true;
    };

    const renderItem = (item, isChild = false) => {
        if (!isItemVisible(item)) return null;

        const hasChildren = item.children && item.children.length > 0;
        const isMenuOpen = openMenus[item.label];

        const ItemContent = (
            <Box
                key={item.label}
                w="100%"
            >
                {hasChildren ? (
                    <Flex
                        p={2}
                        pl={isCollapsed ? 0 : (isChild ? 8 : 2)}
                        justifyContent={isCollapsed ? "center" : "space-between"}
                        borderRadius="md"
                        _hover={{ bg: "whiteAlpha.200", color: "white" }}
                        display="flex"
                        alignItems="center"
                        onClick={() => toggleMenu(item.label)}
                        transition="all 0.2s"
                    >
                        <Flex alignItems="center">
                            <Icon as={item.icon} mr={isCollapsed ? 0 : 3} fontSize="lg" color="whiteAlpha.800" />
                            {!isCollapsed && <Text fontWeight="medium" color="whiteAlpha.900">{item.label}</Text>}
                        </Flex>
                        {!isCollapsed && <Icon as={isMenuOpen ? FiChevronUp : FiChevronDown} color="whiteAlpha.600" />}
                    </Flex>
                ) : (
                    <NavLink
                        to={item.to}
                        style={({ isActive }) => ({
                            color: isActive ? "white" : "rgba(255, 255, 255, 0.7)",
                            textDecoration: 'none'
                        })}
                    >
                        <Box
                            p={2}
                            pl={isCollapsed ? 0 : (isChild ? 8 : 2)}
                            borderRadius="md"
                            bg="transparent"
                            _hover={{ bg: "whiteAlpha.200", color: "white" }}
                            display="flex"
                            alignItems="center"
                            justifyContent={isCollapsed ? "center" : "flex-start"}
                            transition="all 0.2s"
                        >
                            <Icon as={item.icon} mr={isCollapsed ? 0 : 3} fontSize="lg" />
                            {!isCollapsed && <Text fontWeight="medium">{item.label}</Text>}
                        </Box>
                    </NavLink>
                )}

                {hasChildren && !isCollapsed && (
                    <Collapse in={isMenuOpen} animateOpacity>
                        <VStack spacing={1} align="stretch" mt={1}>
                            {item.children.map(child => renderItem(child, true))}
                        </VStack>
                    </Collapse>
                )}
            </Box>
        );

        const WrappedContent = isCollapsed ? (
            <Tooltip label={item.label} placement="right" hasArrow key={item.label}>
                {ItemContent}
            </Tooltip>
        ) : ItemContent;

        if (item.permission) {
            return (
                <CanAccess key={item.label} permission={item.permission}>
                    {WrappedContent}
                </CanAccess>
            );
        }

        return WrappedContent;
    };

    return (
        <Box
            w={{ base: "full", md: isCollapsed ? "80px" : "250px" }}
            h="full"
            bg="brand.900"
            color="whiteAlpha.900"
            borderRight="1px"
            borderColor="whiteAlpha.100"
            pos="fixed"
            zIndex="sticky"
            display="flex"
            flexDirection="column"
            transition="width .3s ease"
            {...props}
        >
            <Flex 
                p={4} 
                alignItems="center" 
                justifyContent={isCollapsed ? "center" : "space-between"}
                mb={2}
            >
                {!isCollapsed && (
                    <Text 
                        fontSize="xl" 
                        fontWeight="bold" 
                        color="white" 
                        as={NavLink} 
                        to="/dashboard" 
                        _hover={{ textDecoration: 'none' }}
                        whiteSpace="nowrap"
                        overflow="hidden"
                    >
                        Task Manager
                    </Text>
                )}
                <IconButton
                    icon={isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
                    onClick={onToggle}
                    variant="ghost"
                    color="whiteAlpha.700"
                    _hover={{ bg: "whiteAlpha.200", color: "white" }}
                    _active={{ bg: "whiteAlpha.300" }}
                    size="sm"
                    aria-label="Toggle Sidebar"
                />
            </Flex>

            <VStack spacing={1} align="stretch" p={isCollapsed ? 2 : 3} flex={1} overflowY="auto">
                {SIDEBAR_ITEMS.map((item) => renderItem(item))}
            </VStack>
        </Box>
    );
};

Sidebar.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    isCollapsed: PropTypes.bool,
    onToggle: PropTypes.func,
};

export default Sidebar;


