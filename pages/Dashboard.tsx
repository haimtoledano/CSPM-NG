import React from 'react';
import { Card, Badge } from '../components/Widgets';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { ShieldAlert, CheckCircle, Server, Cloud } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const mockComplianceData = [
    { name: 'Compliant', value: 450 },
    { name: 'Non-Compliant', value: 85 },
];

const mockAssetsByType = [
    { name: 'Compute', AWS: 120, Azure: 80, SaaS: 0 },
    { name: 'Storage', AWS: 90, Azure: 40, SaaS: 50 },
    { name: 'Identity', AWS: 200, Azure: 150, SaaS: 300 },
    { name: 'Network', AWS: 50, Azure: 30, SaaS: 0 },
];

const mockTrendData = [
    { name: 'Mon', score: 82 },
    { name: 'Tue', score: 84 },
    { name: 'Wed', score: 83 },
    { name: 'Thu', score: 85 },
    { name: 'Fri', score: 88 },
];

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Security Overview</h2>
                    <p className="text-slate-500">Global posture across AWS, Azure, and SaaS.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">Last scanned: 12 mins ago</span>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Run Quick Scan
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Global Compliance</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">87.5%</h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>+2.4% vs last week</span>
                        </div>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-emerald-600" />
                    </div>
                </Card>

                <Card className="p-5 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Critical Risks</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">12</h3>
                        <div className="flex items-center gap-1 mt-2 text-rose-600 text-xs font-medium">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Requires attention</span>
                        </div>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-rose-600" />
                    </div>
                </Card>

                 <Card className="p-5 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Assets</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">1,432</h3>
                         <div className="flex items-center gap-1 mt-2 text-indigo-600 text-xs font-medium">
                            <Server className="w-3 h-3" />
                            <span>Across 4 providers</span>
                        </div>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Cloud className="w-6 h-6 text-indigo-600" />
                    </div>
                </Card>

                 <Card className="p-5 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">SaaS Users</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">890</h3>
                         <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs font-medium">
                            <span>Active identities</span>
                        </div>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-amber-600" />
                    </div>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Compliance Status</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockComplianceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockComplianceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Assets by Provider</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={mockAssetsByType}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
                                <YAxis stroke="#94a3b8" fontSize={12}/>
                                <Tooltip cursor={{fill: '#f1f5f9'}} />
                                <Legend />
                                <Bar dataKey="AWS" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="Azure" stackId="a" fill="#0ea5e9" />
                                <Bar dataKey="SaaS" stackId="a" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            
             {/* Charts Row 2 */}
            <div className="grid grid-cols-1">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Score Trend (Last 7 Days)</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockTrendData}>
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 8}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
