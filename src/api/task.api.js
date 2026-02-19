import api from './axios';

export const getTasks = async (params) => {
    const response = await api.get('/tasks', { params });
    return response.data;
};

export const getTaskById = async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
};

export const createTask = async (taskData) => {
    const config = {
        headers: {}
    };

    if (taskData instanceof FormData) {
        // Let the browser set the Content-Type with the boundary
        config.headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.post('/tasks', taskData, config);
    return response.data;
};

export const updateTask = async (id, taskData) => {
    const config = {
        headers: {}
    };

    if (taskData instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.put(`/tasks/${id}`, taskData, config);
    return response.data;
};

export const deleteTask = async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
};
