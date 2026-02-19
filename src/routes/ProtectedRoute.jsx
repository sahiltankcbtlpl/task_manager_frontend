import { Navigate, Outlet } from 'react-router-dom';
import usePermission from '../hooks/usePermission';
import PropTypes from 'prop-types';
import { ROUTES } from '../config/routes.config';

const ProtectedRoute = ({ permission }) => {
    const hasAccess = usePermission(permission);

    if (!hasAccess) {
        // Redirect to Dashboard or Not Found if no permission
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <Outlet />;
};

ProtectedRoute.propTypes = {
    permission: PropTypes.string.isRequired,
};

export default ProtectedRoute;
