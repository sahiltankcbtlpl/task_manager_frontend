import { useAuth } from '../../context/AuthContext';

const CanAccess = ({ permission, children }) => {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === 'Super Admin') {
        return <>{children}</>;
    }

    if (user.permissions && user.permissions.some(p => {
        const val = (typeof p === 'object' && p !== null) ? p.value : p;
        return val === permission;
    })) {
        return <>{children}</>;
    }

    return null;
};

export default CanAccess;
