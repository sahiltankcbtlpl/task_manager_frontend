import api from './axios';

export const getDocuments = async (projectId = '', page = 1, limit = 10, search = '') => {
    const response = await api.get(`/documents`, {
        params: { project: projectId, page, limit, search }
    });
    return response.data;
};

export const createDocument = async (documentData) => {
    const response = await api.post('/documents', documentData);
    return response.data;
};

export const requestReview = async (documentId, requestType = 'view') => {
    const response = await api.post(`/documents/${documentId}/request-review`, { requestType });
    return response.data;
};

export const respondToReview = async (documentId, requestId, status) => {
    const response = await api.put(`/documents/${documentId}/respond-review`, {
        requestId,
        status,
    });
    return response.data;
};


export const updateDocument = async (documentId, documentData) => {
    const response = await api.put(`/documents/${documentId}`, documentData);
    return response.data;
};

export const deleteDocument = async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
};

export const autosaveDocument = async (documentId, documentData) => {
    const response = await api.patch(`/documents/${documentId}/autosave`, documentData);
    return response.data;
};

export const requestAccess = async (documentId, requestType = 'edit') => {
    const response = await api.post(`/documents/${documentId}/request-access`, { requestType });
    return response.data;
};
