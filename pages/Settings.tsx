
import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../components/Widgets';
import { User, AuditLog, RoleDefinition, UserRole, AIConfig, SyslogConfig } from '../types';
import { sendTestSyslog } from '../services/syslogService';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import { Users, Shield, FileText, Plus, MoreVertical, Search, Lock, Settings as SettingsIcon, Eye, EyeOff, Save, RefreshCw, Server, Cloud, X, Mail, User as UserIcon, Activity, AlertTriangle, Trash2, Edit2, QrCode } from 'lucide-react';

const MOCK_ROLES: RoleDefinition[] = [
    { 
        name: 'Admin', 
        description: 'Full access to all modules, including Secrets and User Management.',
        permissions: ['read:all', 'write:all', 'manage:users', 'manage:secrets', 'manage:connectors']
    },
    { 
        name: 'Auditor', 
        description: 'Read-only access to Dashboards, Reports, and Inventory.',
        permissions: ['read:dashboard', 'read:inventory', 'read:reports', 'export:data']
    },
    { 
        name: 'Viewer', 
        description: 'Limited view access for specific resources.',
        permissions: ['read:dashboard', 'read:inventory']
    },
];

const MOCK_LOGS: AuditLog[] = [
    { id: 'l1', actor: 'john.doe@cspm-ng.com', action: 'CREATE_CONNECTOR', target: 'AWS-Prod-01', timestamp: '2023-10-27 09:35:12', ip_address: '10.0.0.5' },
    { id: 'l2', actor: 'jane.smith@cspm-ng.com', action: 'VIEW_REPORT', target: 'Compliance-Q3', timestamp: '2023-10-26 14:20:05', ip_address: '10.0.0.8' },
    { id: 'l3', actor: 'system', action: 'SYNC_INVENTORY', target: 'All Providers', timestamp: '2023-10-27 00:00:00', ip_address: '127.0.0.1' },
    { id: 'l4', actor: 'john.doe@cspm-ng.com', action: 'UPDATE_ROLE', target: 'mike.dev@cspm-ng.com', timestamp: '2023-10-25 11:10:00', ip_address: '10.0.0.5' },
];

const STORAGE_KEY_CONFIG = 'CSPM_AI_CONFIG';
const STORAGE_KEY_SYSLOG = 'CSPM_SYSLOG_CONFIG';

const Settings: React.FC = () => {
    const { currentUser, users, addUser, updateUser, deleteUser, getCurrentUserMfaSecret } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'logs' | 'config' | 'syslog' | 'account'>('account');
    
    // User Management State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Viewer' as UserRole });
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Account / MFA State
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQr, setShowQr] = useState(false);

    // AI Config State
    const [aiConfig, setAiConfig] = useState<AIConfig>({
        provider: 'GEMINI',
        geminiKey: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3'
    });

    // Syslog Config State
    const [syslogConfig, setSyslogConfig] = useState<SyslogConfig>({
        enabled: false,
        host: '10.0.0.50',
        port: 514,
        protocol: 'UDP'
    });
    const [testLogOutput, setTestLogOutput] = useState('');

    const [showKey, setShowKey] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{type: 'success'|'neutral', text: string}>({type: 'neutral', text: ''});

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const storedAI = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (storedAI) {
            setAiConfig(JSON.parse(storedAI));
        }

        const storedSyslog = localStorage.getItem(STORAGE_KEY_SYSLOG);
        if (storedSyslog) {
            setSyslogConfig(JSON.parse(storedSyslog));
        }
    }, []);

    // Generate QR code for My Account tab
    useEffect(() => {
        if (activeTab === 'account' && currentUser) {
            const secret = getCurrentUserMfaSecret();
            if (secret) {
                const otpUri = `otpauth://totp/CSPM-NG:${currentUser.email}?secret=${secret}&issuer=CSPM-NG`;
                QRCode.toDataURL(otpUri, (err, url) => {
                    if (!err) setQrCodeUrl(url);
                });
            }
        }
    }, [activeTab, currentUser, getCurrentUserMfaSecret]);

    // --- Config Handlers ---

    const handleSaveConfig = () => {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(aiConfig));
        localStorage.setItem(STORAGE_KEY_SYSLOG, JSON.stringify(syslogConfig));
        setStatusMsg({type: 'success', text: 'Settings Saved Successfully'});
        setTimeout(() => setStatusMsg({type: 'neutral', text: ''}), 3000);
    };

    const handleResetConfig = () => {
        localStorage.removeItem(STORAGE_KEY_CONFIG);
        setAiConfig({
            provider: 'GEMINI',
            geminiKey: '',
            ollamaUrl: 'http://localhost:11434',
            ollamaModel: 'llama3'
        });
        setStatusMsg({type: 'neutral', text: 'Reverted to Defaults'});
    };

    const updateConfig = (field: keyof AIConfig, value: string) => {
        setAiConfig(prev => ({...prev, [field]: value}));
    };

    const updateSyslogConfig = (field: keyof SyslogConfig, value: any) => {
        setSyslogConfig(prev => ({...prev, [field]: value}));
    };

    const handleTestSyslog = async () => {
        try {
            const sampleLog = MOCK_LOGS[0];
            const output = await sendTestSyslog(syslogConfig, sampleLog);
            setTestLogOutput(output);
        } catch (error: any) {
            setTestLogOutput(`Error: ${error.message}`);
        }
    };

    // --- User Handlers ---

    const handleOpenAddUser = () => {
        setEditingUser(null);
        setUserForm({ name: '', email: '', role: 'Viewer' });
        setIsUserModalOpen(true);
    };

    const handleOpenEditUser = (user: User) => {
        setEditingUser(user);
        setUserForm({ name: user.name, email: user.email, role: user.role });
        setIsUserModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUser(userId);
        }
        setActiveMenuId(null);
    };

    const handleSaveUser = () => {
        if (!userForm.name || !userForm.email) return;

        if (editingUser) {
            const updatedUser: User = {
                ...editingUser,
                name: userForm.name,
                email: userForm.email,
                role: userForm.role
            };
            updateUser(updatedUser);
        } else {
            const userToAdd: User = {
                id: Date.now().toString(),
                name: userForm.name,
                email: userForm.email,
                role: userForm.role,
                status: 'Active',
                last_login: 'Never'
            };
            addUser(userToAdd);
        }
        setIsUserModalOpen(false);
    };

    const toggleMenu = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation(); 
        setActiveMenuId(activeMenuId === userId ? null : userId);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Platform Management</h2>
                    <p className="text-slate-500">Manage users, access controls, and system configuration.</p>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('account')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'account' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserIcon className="w-4 h-4" />
                        My Account
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield className="w-4 h-4" />
                        Roles & Permissions
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-4 h-4" />
                        Audit Logs
                    </button>
                    <button 
                        onClick={() => setActiveTab('syslog')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'syslog' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity className="w-4 h-4" />
                        Log Forwarding
                    </button>
                    <button 
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'config' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        System Config
                    </button>
                </div>

                <div className="p-6">
                    {/* MY ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="max-w-3xl space-y-8 animate-fadeIn">
                             <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400">
                                    {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'JD'}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900">{currentUser?.name}</h3>
                                    <p className="text-slate-500 flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> {currentUser?.email}
                                    </p>
                                    <div className="pt-2">
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                </div>
                             </div>

                             <div className="border-t border-slate-100 pt-6">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-600" />
                                    Security Settings
                                </h4>

                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-sm">Two-Factor Authentication (MFA)</h5>
                                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                                                Your account is secured with TOTP. Use Google Authenticator or Authy to sign in.
                                            </p>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>

                                    <div className="mt-6">
                                        {!showQr ? (
                                            <button 
                                                onClick={() => setShowQr(true)}
                                                className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-indigo-100"
                                            >
                                                <QrCode className="w-4 h-4" />
                                                Reveal QR Code
                                            </button>
                                        ) : (
                                            <div className="animate-fadeIn">
                                                <p className="text-xs text-slate-500 mb-3">Scan this code to add your account to a new device.</p>
                                                <div className="bg-white p-4 inline-block rounded-lg shadow-sm border border-slate-200">
                                                    {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR" className="w-40 h-40 mix-blend-multiply" />}
                                                </div>
                                                <div className="mt-4">
                                                    <button 
                                                        onClick={() => setShowQr(false)}
                                                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                                                    >
                                                        Hide QR Code
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search users..." 
                                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button 
                                    onClick={handleOpenAddUser}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add User
                                </button>
                            </div>
                            <div className="overflow-x-visible">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Last Login</th>
                                            <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{user.name}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                        user.role === 'Auditor' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={user.status === 'Active' ? 'success' : 'neutral'}>{user.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{user.last_login}</td>
                                                <td className="px-4 py-3 text-right relative">
                                                    <button 
                                                        onClick={(e) => toggleMenu(e, user.id)}
                                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {activeMenuId === user.id && (
                                                        <div className="absolute right-8 top-0 z-20 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 animate-fadeIn origin-top-right">
                                                            <button 
                                                                onClick={() => handleOpenEditUser(user)}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-slate-400" />
                                                                Edit User
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete User
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ROLES TAB */}
                    {activeTab === 'roles' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {MOCK_ROLES.map(role => (
                                <div key={role.name} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-lg text-slate-900">{role.name}</h3>
                                        <Shield className={`w-5 h-5 ${
                                            role.name === 'Admin' ? 'text-purple-600' : 
                                            role.name === 'Auditor' ? 'text-blue-600' : 'text-slate-400'
                                        }`} />
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 h-10">{role.description}</p>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permissions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {role.permissions.map(perm => (
                                                <span key={perm} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 font-mono">
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AUDIT LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-slate-900">Recent Activity</h3>
                                <button className="text-sm text-indigo-600 hover:text-indigo-800">Export CSV</button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-slate-500">Timestamp</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Actor</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Action</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">Target</th>
                                            <th className="px-4 py-3 font-medium text-slate-500">IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {MOCK_LOGS.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50 font-mono text-xs">
                                                <td className="px-4 py-3 text-slate-500">{log.timestamp}</td>
                                                <td className="px-4 py-3 text-indigo-600">{log.actor}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-700">{log.action}</td>
                                                <td className="px-4 py-3 text-slate-600">{log.target}</td>
                                                <td className="px-4 py-3 text-slate-400">{log.ip_address}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* LOG FORWARDING (SYSLOG) TAB */}
                    {activeTab === 'syslog' && (
                        <div className="max-w-3xl space-y-6">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Syslog Configuration (CEF)</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Forward audit logs to a SIEM or Log Collector in Common Event Format.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={syslogConfig.enabled}
                                                onChange={(e) => updateSyslogConfig('enabled', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            <span className="ml-3 text-sm font-medium text-slate-700">{syslogConfig.enabled ? 'Enabled' : 'Disabled'}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className={`space-y-4 ${!syslogConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Syslog Server Host/IP</label>
                                            <input 
                                                type="text" 
                                                value={syslogConfig.host}
                                                onChange={(e) => updateSyslogConfig('host', e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="10.0.0.50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                                            <input 
                                                type="number" 
                                                value={syslogConfig.port}
                                                onChange={(e) => updateSyslogConfig('port', parseInt(e.target.value))}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="514"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Protocol</label>
                                            <select 
                                                value={syslogConfig.protocol}
                                                onChange={(e) => updateSyslogConfig('protocol', e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            >
                                                <option value="UDP">UDP (Standard)</option>
                                                <option value="TCP">TCP</option>
                                                <option value="TLS">TLS (Secure)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {syslogConfig.enabled && (
                                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-sm flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-400" />
                                            Connection Test & Preview
                                        </h3>
                                        <button 
                                            onClick={handleTestSyslog}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded transition-colors"
                                        >
                                            Send Test Log
                                        </button>
                                    </div>
                                    
                                    {testLogOutput ? (
                                        <div className="space-y-2 animate-fadeIn">
                                            <p className="text-xs text-slate-400">Preview of CEF Payload:</p>
                                            <pre className="bg-black/30 p-3 rounded-lg text-[10px] font-mono text-emerald-300 break-all border border-slate-800">
                                                {testLogOutput}
                                            </pre>
                                            <div className="flex items-center gap-2 text-xs text-amber-400 mt-2">
                                                <AlertTriangle className="w-3 h-3" />
                                                <span>Note: In a browser environment, this simulates the backend forwarding logic.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">Click "Send Test Log" to generate a sample CEF message.</p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveConfig}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Forwarding Rules
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SYSTEM CONFIG TAB */}
                    {activeTab === 'config' && (
                         <div className="max-w-3xl space-y-8">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-3 text-sm">AI Provider Selection</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => updateConfig('provider', 'GEMINI')}
                                        className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${aiConfig.provider === 'GEMINI' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Cloud className={`w-6 h-6 ${aiConfig.provider === 'GEMINI' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold text-sm ${aiConfig.provider === 'GEMINI' ? 'text-indigo-900' : 'text-slate-900'}`}>Google Gemini</p>
                                            <p className="text-xs text-slate-500">Cloud-based, high speed (Default)</p>
                                        </div>
                                        {aiConfig.provider === 'GEMINI' && <div className="ml-auto w-3 h-3 bg-indigo-600 rounded-full"></div>}
                                    </button>

                                    <button 
                                        onClick={() => updateConfig('provider', 'OLLAMA')}
                                        className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${aiConfig.provider === 'OLLAMA' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Server className={`w-6 h-6 ${aiConfig.provider === 'OLLAMA' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold text-sm ${aiConfig.provider === 'OLLAMA' ? 'text-indigo-900' : 'text-slate-900'}`}>Local Ollama</p>
                                            <p className="text-xs text-slate-500">Private, local inference</p>
                                        </div>
                                        {aiConfig.provider === 'OLLAMA' && <div className="ml-auto w-3 h-3 bg-indigo-600 rounded-full"></div>}
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                                {aiConfig.provider === 'GEMINI' ? (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div className="flex items-start gap-3">
                                            <SettingsIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                                            <div>
                                                <h3 className="font-bold text-indigo-900 text-sm">Gemini Configuration</h3>
                                                <p className="text-xs text-indigo-700 mt-1">
                                                    Uses Google's Generative AI API. Requires an internet connection.
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <input
                                                    type={showKey ? "text" : "password"}
                                                    value={aiConfig.geminiKey}
                                                    onChange={(e) => updateConfig('geminiKey', e.target.value)}
                                                    className="pl-10 pr-10 block w-full rounded-lg border-slate-300 bg-white border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2.5"
                                                    placeholder="AI Studio API Key"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowKey(!showKey)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showKey ? (
                                                        <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div className="flex items-start gap-3">
                                            <Server className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                                            <div>
                                                <h3 className="font-bold text-indigo-900 text-sm">Ollama Configuration</h3>
                                                <p className="text-xs text-indigo-700 mt-1">
                                                    Connects to a local Ollama instance. <br/>
                                                    <span className="font-bold text-rose-600">Important:</span> You must run Ollama with <code>OLLAMA_ORIGINS="*"</code> to allow browser access.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                                                <input
                                                    type="text"
                                                    value={aiConfig.ollamaUrl}
                                                    onChange={(e) => updateConfig('ollamaUrl', e.target.value)}
                                                    className="block w-full rounded-lg border-slate-300 bg-white border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                                                    placeholder="http://localhost:11434"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                                                <input
                                                    type="text"
                                                    value={aiConfig.ollamaModel}
                                                    onChange={(e) => updateConfig('ollamaModel', e.target.value)}
                                                    className="block w-full rounded-lg border-slate-300 bg-white border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                                                    placeholder="e.g., llama3, mistral"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className={`text-sm font-medium ${statusMsg.type === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {statusMsg.text}
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleResetConfig}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-rose-600 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reset Defaults
                                    </button>
                                    <button
                                        onClick={handleSaveConfig}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                         </div>
                    )}
                </div>
            </Card>

            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={userForm.name}
                                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                                        className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Alice Engineer"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="email" 
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                                        className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="alice@company.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select 
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({...userForm, role: e.target.value as UserRole})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Auditor">Auditor</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                             <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-700 border border-indigo-100">
                                <p>
                                    <strong>Note:</strong> After creating this user, they will need to enter their email on the login screen to set up their TOTP device for the first time.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900">Cancel</button>
                            <button 
                                onClick={handleSaveUser}
                                disabled={!userForm.name || !userForm.email}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {editingUser ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
