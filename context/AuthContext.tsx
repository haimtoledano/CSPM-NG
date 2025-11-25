
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import * as OTPAuth from 'otpauth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'CSPM_AUTH_STATE';
const STORAGE_KEY_USERS = 'CSPM_USERS_DB';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Session State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // Database State
    const [users, setUsers] = useState<User[]>([]);

    // Initial Load
    useEffect(() => {
        // 1. Load Users Database
        const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
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
    }, []);

    // Save Users whenever they change
    useEffect(() => {
        if (users.length > 0) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        }
    }, [users]);

    // --- User Management ---

    const addUser = (newUser: User) => {
        setUsers(prev => [...prev, newUser]);
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        // If updating self, update session
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user: updatedUser }));
        }
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    // --- Auth Logic ---

    const checkEmailStatus = (email: string): { status: 'UNKNOWN' | 'KNOWN_NO_MFA' | 'KNOWN_WITH_MFA' | 'SYSTEM_INIT' } => {
        // Case 1: System Bootstrap (First run, no users at all)
        if (users.length === 0) {
            return { status: 'SYSTEM_INIT' };
        }

        // Case 2: Check if user exists
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { status: 'UNKNOWN' };
        }

        // Case 3: Check MFA status
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
        // Validate token first
        const totp = new OTPAuth.TOTP({
            issuer: 'CSPM-NG',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret)
        });

        const delta = totp.validate({ token, window: 1 });
        
        if (delta !== null) {
            // Success: Save user to DB
            // Check if this is a bootstrap event (new admin) or existing user setup
            const existingUserIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (existingUserIndex === -1 && users.length === 0) {
                // Create First Admin
                const newAdmin: User = {
                    id: Date.now().toString(),
                    name: email.split('@')[0],
                    email: email,
                    role: 'Admin',
                    status: 'Active',
                    last_login: new Date().toISOString(),
                    mfaSecret: secret
                };
                setUsers([newAdmin]);
                // Login immediately
                setIsAuthenticated(true);
                setCurrentUser(newAdmin);
                localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user: newAdmin }));
                return true;
            } else if (existingUserIndex >= 0) {
                // Update Existing User
                const updatedUsers = [...users];
                updatedUsers[existingUserIndex] = {
                    ...updatedUsers[existingUserIndex],
                    mfaSecret: secret,
                    last_login: new Date().toISOString()
                };
                setUsers(updatedUsers);
                
                // Login
                setIsAuthenticated(true);
                setCurrentUser(updatedUsers[existingUserIndex]);
                localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user: updatedUsers[existingUserIndex] }));
                return true;
            }
        }
        return false;
    };

    const login = async (email: string, code: string): Promise<boolean> => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || !user.mfaSecret) return false;

        const totp = new OTPAuth.TOTP({
            issuer: 'CSPM-NG',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(user.mfaSecret)
        });

        const delta = totp.validate({ token: code, window: 1 });
        
        if (delta !== null) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            
            // Update last login
            updateUser({ ...user, last_login: new Date().toISOString() });
            
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isAuthenticated: true, user }));
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
            getCurrentUserMfaSecret
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
