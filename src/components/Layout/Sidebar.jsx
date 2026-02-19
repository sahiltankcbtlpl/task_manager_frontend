import { Box, VStack, Text, Icon } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../config/routes.config";

import CanAccess from "../common/CanAccess";
import { SIDEBAR_ITEMS } from "../../config/sidebar.config";
import PropTypes from "prop-types";

const Sidebar = ({ isOpen, onClose, ...props }) => {
    return (
        <Box
            w={{ base: "full", md: "250px" }}
            h="full"
            bg="white"
            borderRight="1px"
            borderColor="gray.200"
            pos="fixed"
            zIndex="sticky"
            {...props}
        >
            <VStack spacing={4} align="stretch" p={4}>
                <Text fontSize="xl" fontWeight="bold" color="brand.600" mb={6} as={NavLink} to="/dashboard" _hover={{ textDecoration: 'none' }}>
                    Task Manager
                </Text>

                {SIDEBAR_ITEMS.map((item) => {
                    const LinkContent = (
                        <NavLink
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

                    if (item.permission) {
                        return (
                            <CanAccess key={item.to} permission={item.permission}>
                                {LinkContent}
                            </CanAccess>
                        );
                    }

                    return <div key={item.to}>{LinkContent}</div>;
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
