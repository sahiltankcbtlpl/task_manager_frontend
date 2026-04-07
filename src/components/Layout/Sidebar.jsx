import { Box, VStack, Text, Icon } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../config/routes.config";
import theme from "../../theme/chakra.theme";
import CanAccess from "../common/CanAccess";
import { SIDEBAR_ITEMS } from "../../config/sidebar.config";
import PropTypes from "prop-types";
import useAuth from "../../hooks/useAuth";

const Sidebar = ({ isOpen, onClose, ...props }) => {
    const { user } = useAuth();
    return (
        <Box
            w={{ base: "full", md: "250px" }}
            h="full"
            bg="white"
            borderRight="1px"
            borderColor="gray.200"
            pos="fixed"
            zIndex="sticky"
            display="flex"
            flexDirection="column"
            {...props}
        >
            <VStack spacing={4} align="stretch" p={4} flex={1}>
                <Text fontSize="xl" fontWeight="bold" color="brand.600" mb={6} as={NavLink} to="/dashboard" _hover={{ textDecoration: 'none' }}>
                    Task Manager
                </Text>

                {SIDEBAR_ITEMS.map((item) => {
                    const LinkContent = (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => ({
                                color: isActive ? "#3182ce" : "inherit",
                            })}
                        >
                            <Box
                                p={2}
                                borderRadius="md"
                                _hover={{ bg: "gray.100" }}
                                display="flex"
                                alignItems="center"
                            >
                                <Icon as={item.icon} mr={3} />
                                {item.label}
                            </Box>
                        </NavLink>
                    );

                    if (item.ownerOnly) {
                        const isOwner = user?.role === 'Company Owner' || user?.role?.name === 'Company Owner';
                        if (!isOwner) return null;
                        return LinkContent;
                    }

                    if (item.superAdminOnly) {
                        const isSuperAdmin = user?.role === 'Super Admin' || user?.role?.name === 'Super Admin';
                        if (!isSuperAdmin) return null;
                        return LinkContent;
                    }

                    if (item.permission) {
                        return (
                            <CanAccess key={item.to} permission={item.permission}>
                                {LinkContent}
                            </CanAccess>
                        );
                    }

                    return LinkContent;
                })}
            </VStack>

        </Box>
    );
};

Sidebar.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
};

export default Sidebar;
