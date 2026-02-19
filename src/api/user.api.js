import api from './axios';

export const createStaff = async (staffData) => {
    const response = await api.post('/users', staffData);
    return response.data;
};

export const getStaffList = async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
};

export const getStaffById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const updateStaff = async (id, staffData) => {
    const response = await api.put(`/users/${id}`, staffData);
    return response.data;
};

export const deleteStaff = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};
