import api from './axios';

export const getTaskStatuses = async () => {
    const response = await api.get('/taskStatus');
    return response.data;
};

export const getTaskStatusById = async (id) => {
    const response = await api.get(`/taskStatus/${id}`);
    return response.data;
};

export const createTaskStatus = async (data) => {
    const response = await api.post('/taskStatus', data);
    return response.data;
};

export const updateTaskStatus = async (id, data) => {
    const response = await api.put(`/taskStatus/${id}`, data);
    return response.data;
};

export const deleteTaskStatus = async (id) => {
    const response = await api.delete(`/taskStatus/${id}`);
    return response.data;
};
