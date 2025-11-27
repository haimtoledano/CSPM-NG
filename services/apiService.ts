import { DatabaseConfig, User, Connector, Asset, SystemConfig } from '../types';

const API_BASE = '/api';

// Generic Fetch Wrapper
const request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error.error || `API Error ${res.status}`);
    }
    return res.json();
};

export const apiService = {
    // System
    checkSystemStatus: () => request<{ isSetup: boolean }>('/status').catch(() => ({ isSetup: false })),
    
    updateSystemConfig: (config: Partial<SystemConfig>) => request<{ success: boolean }>('/setup', {
        method: 'POST',
        body: JSON.stringify(config)
    }),

    // Users
    getUsers: () => request<User[]>('/users'),
    
    syncUser: (user: User) => request<void>('/users', {
        method: 'POST',
        body: JSON.stringify(user)
    }),

    // Connectors
    getConnectors: () => request<Connector[]>('/connectors').catch(() => []),
    
    addConnector: (connector: Connector) => request<void>('/connectors', {
        method: 'POST',
        body: JSON.stringify(connector)
    }),

    deleteConnector: (id: string) => request<void>(`/connectors/${id}`, {
        method: 'DELETE'
    }),

    syncConnector: (id: string) => request<void>(`/connectors/${id}/sync`, {
        method: 'POST'
    }),

    // Assets
    getAssets: () => request<Asset[]>('/assets').catch(() => []),
    
    addAsset: (asset: Asset) => request<void>('/assets', {
        method: 'POST',
        body: JSON.stringify(asset)
    }),

    // DB Setup (Mock for SQLite, used by frontend logic)
    setupDatabase: async (config: DatabaseConfig) => ({ success: true, message: 'SQLite is auto-configured.' })
};