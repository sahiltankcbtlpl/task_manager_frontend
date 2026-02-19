import { createContext, useState, useEffect, useContext } from 'react';
import { checkSession, loginUser, logoutUser } from '../api/auth.api';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const userData = await checkSession();
                setUser(userData);
            } catch (err) {
                // Session not valid or network error
                // If 401, it just means not logged in, which is fine
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const userData = await loginUser(email, password);
            setUser(userData);
            setError(null);
            return userData;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            setUser(null);
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading: loading, // Consumers expect isLoading
            error,
            login,
            logout,
            updateUser: setUser, // Expose setUser as updateUser to allow valid updates
            isAuthenticated: !!user // Consumers expect isAuthenticated
        }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
// eslint-disable-next-line react-refresh/only-export-components
export default AuthContext;
