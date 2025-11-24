import React, { useState } from 'react';
import { Shield, LayoutDashboard, Database, Link as LinkIcon, Bot, Menu, Bell, Search, User, LogOut, Settings, FileCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // Using react-router-dom for linking (HashRouter provided in App)

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Asset Inventory', path: '/inventory', icon: Database },
        { name: 'Connectors', path: '/connectors', icon: LinkIcon },
        { name: 'Compliance & Policies', path: '/policies', icon: FileCheck },
        { name: 'Security Copilot', path: '/copilot', icon: Bot },
        { name: 'Platform Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800">
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
                            <span className="text-xs font-bold text-slate-300">JD</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">John Doe</p>
                            <p className="text-xs text-slate-400 truncate">Security Admin</p>
                        </div>
                        <LogOut className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
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
                    
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
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
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;