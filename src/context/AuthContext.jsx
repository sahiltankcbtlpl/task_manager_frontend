import { createContext, useState, useEffect, useContext } from 'react';
import { checkSession, loginUser, logoutUser, register as registerApi } from '../api/auth.api';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [activeCompany, setActiveCompany] = useState(localStorage.getItem('activeCompany') || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const userData = await checkSession();
                setUser(userData);

                // Validate and auto-set activeCompany
                if (userData.companies && userData.companies.length > 0) {
                    const savedCompany = localStorage.getItem('activeCompany');
                    const isCurrentValid = userData.companies.some(c => c._id === savedCompany);
                    
                    if (!isCurrentValid || !savedCompany) {
                        const defaultCompanyId = userData.companies[0]._id;
                        setActiveCompany(defaultCompanyId);
                        localStorage.setItem('activeCompany', defaultCompanyId);
                    } else if (savedCompany !== activeCompany) {
                        setActiveCompany(savedCompany);
                    }
                } else {
                    setActiveCompany(null);
                    localStorage.removeItem('activeCompany');
                }
            } catch (err) {
                setUser(null);
                setActiveCompany(null);
                localStorage.removeItem('activeCompany');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []); // Only run on mount

    const login = async (email, password) => {
        setLoading(true);
        try {
            const userData = await loginUser(email, password);
            setUser(userData);

            // Auto-set the first company as active for every login to ensure fresh context
            if (userData.companies && userData.companies.length > 0) {
                // If the previously saved company is still valid, we could keep it, 
                // but usually switching to the primary/first one is safer for "direct take"
                const isCurrentValid = userData.companies.some(c => c._id === activeCompany);
                if (!isCurrentValid || !activeCompany) {
                    const firstCompanyId = userData.companies[0]._id;
                    setActiveCompany(firstCompanyId);
                    localStorage.setItem('activeCompany', firstCompanyId);
                }
            } else {
                setActiveCompany(null);
                localStorage.removeItem('activeCompany');
            }

            setError(null);
            return userData;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (registerData) => {
        setLoading(true);
        try {
            const userData = await registerApi(registerData);
            // Set the newly created company as active first
            const companyId = userData.company._id;
            localStorage.setItem('activeCompany', companyId);
            setActiveCompany(companyId);

            // Then set the user
            setUser(userData.user);

            setError(null);
            return userData;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const switchCompany = (companyId) => {
        setActiveCompany(companyId);
        localStorage.setItem('activeCompany', companyId);
        // Page reload or state refresh might be needed to reload company-specific data
    };

    const logout = async () => {
        try {
            await logoutUser();
            setUser(null);
            setActiveCompany(null);
            localStorage.removeItem('activeCompany');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            activeCompany,
            isLoading: loading, // Consumers expect isLoading
            error,
            login,
            logout,
            register,
            switchCompany,
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
