import useAuth from './useAuth';
import hasPermission from '../utils/hasPermission';

const usePermission = (permission) => {
    const { user } = useAuth();
    return hasPermission(user, permission);
};

export default usePermission;
