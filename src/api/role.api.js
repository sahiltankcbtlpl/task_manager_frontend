import api from './axios';

export const getRoles = async () => {
    const response = await api.get('/roles');
    return response.data;
};

export const createRole = async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response.data;
};

export const deleteRole = async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
};

export const getRoleById = async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
};

export const updateRole = async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
};
