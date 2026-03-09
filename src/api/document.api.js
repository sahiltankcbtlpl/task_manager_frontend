import api from './axios';

export const getDocuments = async (projectId = '', page = 1, limit = 10, search = '') => {
    const response = await api.get(`/documents`, {
        params: { project: projectId, page, limit, search }
    });
    return response.data;
};

export const createDocument = async (documentData) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    };
    const response = await api.post('/documents', documentData, config);
    return response.data;
};

export const requestReview = async (documentId) => {
    const response = await api.post(`/documents/${documentId}/request-review`);
    return response.data;
};

export const respondToReview = async (documentId, requestId, status) => {
    const response = await api.put(`/documents/${documentId}/respond-review`, {
        requestId,
        status,
    });
    return response.data;
};

export const downloadDocument = async (documentId) => {
    const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
    });
    return response.data;
};

export const updateDocument = async (documentId, documentData) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    };
    const response = await api.put(`/documents/${documentId}`, documentData, config);
    return response.data;
};

export const deleteDocument = async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
};
