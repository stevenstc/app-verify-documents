import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Documentos
export const uploadDocument = async (formData) => {
    const response = await api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const storeInBlockchain = async (documentId, walletAddress) => {
    const response = await api.post(`/documents/${documentId}/store-blockchain`, {
        walletAddress
    });
    return response.data;
};

export const verifyDocumentByHash = async (hash) => {
    const response = await api.get(`/documents/verify/${hash}`);
    return response.data;
};

export const getUserDocuments = async (walletAddress) => {
    const response = await api.get(`/documents/user/${walletAddress}`);
    return response.data;
};

export const verifyUploadedFile = async (formData) => {
    const response = await api.post('/documents/verify-file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

// Usuarios
export const getUserOrCreate = async (walletAddress) => {
    const response = await api.get(`/users/${walletAddress}`);
    return response.data;
};

export const updateSubscription = async (walletAddress, data) => {
    const response = await api.post(`/users/${walletAddress}/subscription`, data);
    return response.data;
};

export const checkSubscription = async (walletAddress) => {
    const response = await api.get(`/users/${walletAddress}/subscription/status`);
    return response.data;
};

export const updateProfile = async (walletAddress, data) => {
    const response = await api.put(`/users/${walletAddress}/profile`, data);
    return response.data;
};

export const getBalance = async (walletAddress) => {
    const response = await api.get(`/users/${walletAddress}/balance`);
    return response.data;
};

export const getUserLimits = async (walletAddress) => {
    const response = await api.get(`/users/${walletAddress}/limits`);
    return response.data;
};

export default api;
