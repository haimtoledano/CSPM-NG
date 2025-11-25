
import React, { useState } from 'react';
import { Shield, LayoutDashboard, Database, Link as LinkIcon, Bot, Menu, Bell, Search, User, LogOut, Settings, FileCheck, FileText, Check, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';

interface LayoutProps {
    children: React.ReactNode;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', title: 'Critical Vulnerability', message: 'CVE-2023-44487 detected on prod-api-server-01.', type: 'error', timestamp: new Date(Date.now() - 1000 * 60 * 30), read: false },
    { id: '2', title: 'Compliance Report Ready', message: 'Monthly CIS Benchmark report is ready for download.', type: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false },
    { id: '3', title: 'New Asset Discovered', message: 'New S3 Bucket "dev-test-bucket" found in us-east-1.', type: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
    { id: '4', title: 'Connector Error', message: 'Azure connection failed to sync. Please re-authenticate.', type: 'warning', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), read: true },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, currentUser, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [showNotifications, setShowNotifications] = useState(false);

    // If on login page, render only children (full screen layout)
    if (location.pathname === '/login') {
        return <>{children}</>;
    }

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Asset Inventory', path: '/inventory', icon: Database },
        { name: 'Connectors', path: '/connectors', icon: LinkIcon },
        { name: 'Compliance & Policies', path: '/policies', icon: FileCheck },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'Security Copilot', path: '/copilot', icon: Bot },
        { name: 'Platform Settings', path: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
        switch (type) {
            case 'error': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'success': return <Check className="w-5 h-5 text-emerald-500" />;
            default: return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar Desktop - Hidden when printing */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 print:hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-800">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">CSPM-NG</h1>
                        <p className="text-xs text-slate-400">Unified Security</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                isActive(item.path)
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-300">
                                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'JD'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{currentUser?.name || 'User'}</p>
                            <p className="text-xs text-slate-400 truncate">{currentUser?.role || 'Viewer'}</p>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-white cursor-pointer" title="Sign Out">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 print:block">
                {/* Header - Hidden when printing */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
                    <div className="flex items-center gap-4">
                        <button 
                            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search assets, policies..." 
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 md:w-80 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 relative">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-20 animate-fadeIn">
                                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-800">
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div 
                                                        key={notif.id} 
                                                        onClick={() => markAsRead(notif.id)}
                                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        <div className="mt-1">
                                                            <NotificationIcon type={notif.type} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                            <p className="text-[10px] text-slate-400 mt-2">
                                                                {notif.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                        {!notif.read && (
                                                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-slate-100 text-center">
                                            <Link to="/settings" onClick={() => setShowNotifications(false)} className="text-xs text-slate-500 hover:text-indigo-600">
                                                Manage Alerts
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <span className="text-sm text-slate-500 font-medium hidden sm:block">Tenant: Acme Corp</span>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 p-4 md:hidden">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2">
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="space-y-2">
                             {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
                                        isActive(item.path)
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-8 border-t border-slate-800 pt-4">
                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-400 w-full">
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-auto p-6 md:p-8 print:p-0 print:overflow-visible">
                    <div className="max-w-7xl mx-auto print:max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
