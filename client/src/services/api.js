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

export const updateDocumentDescription = async (documentId, data) => {
    const response = await api.put(`/documents/${documentId}`, data);
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

export const getPricing = async () => {
    const response = await api.get('/users/pricing');
    return response.data;
};

// Administración
const adminHeaders = (walletAddress) => ({
    headers: {
        'x-wallet-address': walletAddress
    }
});

export const checkAdminAccess = async (walletAddress) => {
    try {
        const response = await api.get('/admin/access', adminHeaders(walletAddress));
        return response.data;
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            return { isAdmin: false };
        }
        throw error;
    }
};

export const getAdminStats = async (walletAddress) => {
    const response = await api.get('/admin/stats', adminHeaders(walletAddress));
    return response.data;
};

export const getAdminTransactions = async (walletAddress, params = {}) => {
    const response = await api.get('/admin/transactions', {
        ...adminHeaders(walletAddress),
        params
    });
    return response.data;
};

export const createAdminTransaction = async (walletAddress, data) => {
    const response = await api.post('/admin/transactions', data, adminHeaders(walletAddress));
    return response.data;
};

export const getAdminClientsWithDocuments = async (walletAddress, params = {}) => {
    const response = await api.get('/admin/clients/documents', {
        ...adminHeaders(walletAddress),
        params
    });
    return response.data;
};

export const getAdminExpiredSubscriptions = async (walletAddress, params = {}) => {
    const response = await api.get('/admin/subscriptions/expired', {
        ...adminHeaders(walletAddress),
        params
    });
    return response.data;
};

export const getAdminPricing = async (walletAddress) => {
    const response = await api.get('/admin/settings/pricing', adminHeaders(walletAddress));
    return response.data;
};

export const updateAdminPricing = async (walletAddress, data) => {
    const response = await api.put('/admin/settings/pricing', data, adminHeaders(walletAddress));
    return response.data;
};

export default api;
