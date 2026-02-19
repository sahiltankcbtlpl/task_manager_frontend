import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';

const ProtectedRoute = ({ permissions }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Permission check if permissions array is provided
    if (permissions && permissions.length > 0) {
        // If user is Super Admin, bypass check
        if (user.role === 'Super Admin') {
            return <Outlet />;
        }

        // Check if user has ANY of the required permissions
        // Or ALL? Usually check if user has at least one required permission for the route?
        // Let's assume ANY for now unless specified.
        // Actually, let's implement validation against user.permissions (which is array of objects {name, value, status})

        // Wait, current AuthContext user object structure from /me endpoint:
        // { _id, name, email, role: "RoleName", permissions: [{name, value, status}, ...] }

        // Let's check permissions.
        const userPermissions = user.permissions?.map(p => p.value) || [];

        const hasPermission = permissions.some(permission => userPermissions.includes(permission));

        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
