import api from './axios';

export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

export const checkSession = async () => {
    const response = await api.get('/auth/me'); // Assuming /me endpoint exists for session check
    return response.data;
};

export const updateProfile = async (userData) => {
    const response = await api.put('/auth/me', userData);
    return response.data;
};
