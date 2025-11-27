import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContextType, User, SystemConfig } from '../types';
import * as OTPAuth from 'otpauth';
import { apiService } from '../services/apiService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'CSPM_AUTH_STATE';
const STORAGE_KEY_USERS = 'CSPM_USERS_DB';
const STORAGE_KEY_SYSTEM = 'CSPM_SYSTEM_CONFIG';

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    appName: 'CSPM-NG',
    logoUrl: '',
    isSetupComplete: false,
    dbConfig: {
        host: 'db',
        port: '5432',
        user: 'postgres',
        dbName: 'cspm_ng',
        isInitialized: false
    }
};

// --- Helper for generating UUIDs in non-secure contexts (HTTP) ---
const generateUUID = () => {
    // Try native API first if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Session State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // User Data State
    const [users, setUsers] = useState<User[]>([]);
    
    // System Config State
    const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
    const [isDbConnected, setIsDbConnected] = useState(false);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            // 1. Check Backend Status
            const status = await apiService.checkSystemStatus();
            setIsDbConnected(status.isSetup);

            if (status.isSetup) {
                // DB MODE: Fetch users from API
                try {
                    const dbUsers = await apiService.getUsers();
                    setUsers(dbUsers);
                } catch (e) {
                    console.error("Failed to fetch users from DB", e);
                }
            } else {
                // LOCAL MODE: Fetch users from LocalStorage
                const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
                if (storedUsers) {
                    setUsers(JSON.parse(storedUsers));
                }
            }

            // 2. Load Session
            const storedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
            if (storedAuth) {
                const parsed = JSON.parse(storedAuth);
                if (parsed.isAuthenticated && parsed.user) {
                    setIsAuthenticated(true);
                    setCurrentUser(parsed.user);
                }
            }

            // 3. Load System Config (Local Prefs for now)
            const storedSystem = localStorage.getItem(STORAGE_KEY_SYSTEM);
            if (storedSystem) {
                setSystemConfig(JSON.parse(storedSystem));
            }
        };
        init();
    }, []);

    // Save Users (Only in Local Mode)
    useEffect(() => {
        if (!isDbConnected && users.length > 0) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        }
    }, [users, isDbConnected]);

    // Save System Config
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SYSTEM, JSON.stringify(systemConfig));
    }, [systemConfig]);

    // --- User Management ---

    const addUser = async (newUser: User) => {
        setUsers(prev => [...prev, newUser]);
        if (isDbConnected) {
            await apiService.syncUser(newUser);
        }
    };

    const updateUser = async (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user: updatedUser }));
        }
        if (isDbConnected) {
            await apiService.syncUser(updatedUser);
        }
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        // Note: Delete API not implemented in this snippet, add if needed
    };

    const updateSystemConfig = (newConfig: SystemConfig) => {
        setSystemConfig(newConfig);
    };

    // --- Auth Logic ---

    const checkEmailStatus = (email: string): { status: 'UNKNOWN' | 'KNOWN_NO_MFA' | 'KNOWN_WITH_MFA' | 'SYSTEM_INIT' } => {
        if (users.length === 0) {
            return { status: 'SYSTEM_INIT' };
        }
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { status: 'UNKNOWN' };
        }
        if (user.mfaSecret) {
            return { status: 'KNOWN_WITH_MFA' };
        } else {
            return { status: 'KNOWN_NO_MFA' };
        }
    };

    const generateTempSecret = (): string => {
        const random = new OTPAuth.Secret({ size: 20 });
        return random.base32;
    };

    const completeMfaSetup = (email: string, secret: string, token: string): boolean => {
        const totp = new OTPAuth.TOTP({
            issuer: systemConfig.appName,
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret)
        });

        const delta = totp.validate({ token, window: 1 });
        
        if (delta !== null) {
            const existingUserIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            
            let userToSave: User;

            if (existingUserIndex === -1 && users.length === 0) {
                // Create Super Admin
                userToSave = {
                    id: generateUUID(), // FIX: Using custom helper instead of crypto.randomUUID()
                    name: email.split('@')[0],
                    email: email,
                    role: 'Admin',
                    status: 'Active',
                    last_login: new Date().toISOString(),
                    mfaSecret: secret,
                    isSuperAdmin: true
                };
                setUsers([userToSave]);
            } else if (existingUserIndex >= 0) {
                // Update Existing
                userToSave = {
                    ...users[existingUserIndex],
                    mfaSecret: secret,
                    last_login: new Date().toISOString()
                };
                const updatedUsers = [...users];
                updatedUsers[existingUserIndex] = userToSave;
                setUsers(updatedUsers);
            } else {
                return false;
            }

            // Sync to Real DB if connected, or Local
            if (isDbConnected) {
                apiService.syncUser(userToSave);
            }

            setIsAuthenticated(true);
            setCurrentUser(userToSave);
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user: userToSave }));
            return true;
        }
        return false;
    };

    const login = async (email: string, code: string): Promise<boolean> => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || !user.mfaSecret) return false;

        const totp = new OTPAuth.TOTP({
            issuer: systemConfig.appName,
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(user.mfaSecret)
        });

        const delta = totp.validate({ token: code, window: 1 });
        
        if (delta !== null) {
            setIsAuthenticated(true);
            const updatedUser = { ...user, last_login: new Date().toISOString() };
            setCurrentUser(updatedUser);
            updateUser(updatedUser); // Will sync to DB
            
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user: updatedUser }));
            return true;
        }

        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY_AUTH);
    };

    const getCurrentUserMfaSecret = () => {
        return currentUser?.mfaSecret;
    }

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            currentUser, 
            checkEmailStatus,
            login, 
            logout, 
            generateTempSecret, 
            completeMfaSetup,
            users,
            addUser,
            updateUser,
            deleteUser,
            getCurrentUserMfaSecret,
            systemConfig,
            updateSystemConfig
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
