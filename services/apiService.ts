import { DatabaseConfig, User } from '../types';

const API_BASE = '/api';

export const apiService = {
    // Check if backend is alive
    checkSystemStatus: async (): Promise<{ isSetup: boolean }> => {
        try {
            const res = await fetch(`${API_BASE}/status`);
            if (!res.ok) return { isSetup: false };
            return await res.json();
        } catch (e) {
            return { isSetup: false };
        }
    },

    // Update System Config (Branding)
    updateSystemConfig: async (config: any): Promise<{ success: boolean }> => {
        try {
            await fetch(`${API_BASE}/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            return { success: true };
        } catch (e) {
            console.error(e);
            return { success: false };
        }
    },

    // Get Users from DB
    getUsers: async (): Promise<User[]> => {
        const res = await fetch(`${API_BASE}/users`);
        if (!res.ok) throw new Error("Failed to fetch users");
        return await res.json();
    },

    // Upsert User to DB
    syncUser: async (user: User): Promise<void> => {
        await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
    },

    // Setup Database - No-op for SQLite (it's auto)
    setupDatabase: async (config: DatabaseConfig): Promise<{ success: boolean; message?: string }> => {
        return { success: true, message: 'SQLite is auto-configured.' };
    }
};