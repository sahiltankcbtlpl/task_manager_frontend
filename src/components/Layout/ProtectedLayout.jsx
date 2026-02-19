import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loader from '../common/Loader';
import { ROUTES } from '../../config/routes.config';
import AppLayout from './AppLayout';

const ProtectedLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Wrap authenticated routes with the main app layout
    return (
        <AppLayout>
            <Outlet />
        </AppLayout>
    );
};

export default ProtectedLayout;
