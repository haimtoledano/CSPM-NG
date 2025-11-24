
import React, { useState } from 'react';
import { Card, Badge } from '../components/Widgets';
import { User, AuditLog, RoleDefinition, UserRole } from '../types';
import { Users, Shield, FileText, Plus, MoreVertical, Search, Lock } from 'lucide-react';

const MOCK_USERS: User[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@sentinel.com', role: 'Admin', status: 'Active', last_login: '2023-10-27 09:30:00' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@sentinel.com', role: 'Auditor', status: 'Active', last_login: '2023-10-26 14:15:00' },
    { id: '3', name: 'Mike DevOps', email: 'mike.dev@sentinel.com', role: 'Viewer', status: 'Inactive', last_login: '2023-10-15 10:00:00' },
];

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
    { id: 'l1', actor: 'john.doe@sentinel.com', action: 'CREATE_CONNECTOR', target: 'AWS-Prod-01', timestamp: '2023-10-27 09:35:12', ip_address: '10.0.0.5' },
    { id: 'l2', actor: 'jane.smith@sentinel.com', action: 'VIEW_REPORT', target: 'Compliance-Q3', timestamp: '2023-10-26 14:20:05', ip_address: '10.0.0.8' },
    { id: 'l3', actor: 'system', action: 'SYNC_INVENTORY', target: 'All Providers', timestamp: '2023-10-27 00:00:00', ip_address: '127.0.0.1' },
    { id: 'l4', actor: 'john.doe@sentinel.com', action: 'UPDATE_ROLE', target: 'mike.dev@sentinel.com', timestamp: '2023-10-25 11:10:00', ip_address: '10.0.0.5' },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'logs'>('users');
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Platform Management</h2>
                    <p className="text-slate-500">Manage users, access controls, and audit logs.</p>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'roles' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield className="w-4 h-4" />
                        Roles & Permissions
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-4 h-4" />
                        Audit Logs
                    </button>
                </div>

                <div className="p-6">
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
                                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                    <Plus className="w-4 h-4" />
                                    Add User
                                </button>
                            </div>
                            <div className="overflow-x-auto">
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
                                        {MOCK_USERS.map(user => (
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
                                                <td className="px-4 py-3 text-right">
                                                    <button className="text-slate-400 hover:text-slate-600">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
                </div>
            </Card>
        </div>
    );
};

export default Settings;
