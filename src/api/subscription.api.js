import axiosInstance from './axios';

export const getSubscriptions = async (params) => {
    const response = await axiosInstance.get('/subscriptions', { params });
    return response.data;
};

export const getSubscriptionById = async (id) => {
    const response = await axiosInstance.get(`/subscriptions/${id}`);
    return response.data;
};

export const createSubscription = async (data) => {
    const response = await axiosInstance.post('/subscriptions', data);
    return response.data;
};

export const updateSubscription = async (id, data) => {
    const response = await axiosInstance.put(`/subscriptions/${id}`, data);
    return response.data;
};

export const deleteSubscription = async (id) => {
    const response = await axiosInstance.delete(`/subscriptions/${id}`);
    return response.data;
};

export const getSubscriptionUsage = async () => {
    const response = await axiosInstance.get('/subscriptions/usage');
    return response.data;
};
