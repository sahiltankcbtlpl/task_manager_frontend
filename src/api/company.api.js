import api from './axios';

export const getCompany = async (companyId) => {
    const response = await api.get(`/companies/${companyId}`);
    return response.data;
};

export const updateCompany = async (companyId, formData) => {
    // We use FormData because we might be uploading a logo file
    const response = await api.put(`/companies/${companyId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
