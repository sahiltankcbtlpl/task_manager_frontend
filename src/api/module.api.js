import axiosInstance from './axios';

export const getModules = async () => {
    const response = await axiosInstance.get('/modules');
    return response.data;
};

export const createModule = async (data) => {
    const response = await axiosInstance.post('/modules', data);
    return response.data;
};

export const deleteModule = async (id) => {
    const response = await axiosInstance.delete(`/modules/${id}`);
    return response.data;
};
