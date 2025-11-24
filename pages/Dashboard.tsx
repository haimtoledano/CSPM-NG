import React, { useState } from 'react';
import { Card } from '../components/Widgets';
import { DashboardWidget, WidgetType, DataSource, WidgetSize } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { CheckCircle, Plus, Settings, Trash2, X, BarChart3, PieChart as PieIcon, Activity, LayoutGrid, Filter } from 'lucide-react';

// --- DATA SOURCE REPOSITORY (BASE DATA for ALL) ---
const DATA_SOURCES = {
    GLOBAL_COMPLIANCE: {
        label: 'Global Compliance Rate',
        value: '87.5%',
        subtext: '+2.4% vs last week',
        isChart: false,
        chartData: [
            { name: 'Compliant', value: 450 },
            { name: 'Non-Compliant', value: 85 },
        ]
    },
    CRITICAL_RISKS: {
        label: 'Critical Risks',
        value: '12',
        subtext: 'Requires attention',
        isChart: false,
        chartData: []
    },
    TOTAL_ASSETS: {
        label: 'Total Assets',
        value: '1,432',
        subtext: 'Across 4 providers',
        isChart: false,
        chartData: []
    },
    SAAS_USERS: {
        label: 'SaaS Users',
        value: '890',
        subtext: 'Active identities',
        isChart: false,
        chartData: []
    },
    ASSETS_BY_PROVIDER: {
        label: 'Assets Distribution',
        value: null,
        subtext: null,
        isChart: true,
        chartData: [
            { name: 'Compute', AWS: 120, Azure: 80, SaaS: 0 },
            { name: 'Storage', AWS: 90, Azure: 40, SaaS: 50 },
            { name: 'Identity', AWS: 200, Azure: 150, SaaS: 300 },
            { name: 'Network', AWS: 50, Azure: 30, SaaS: 0 },
        ]
    },
    RISK_TREND: {
        label: 'Risk Score Trend',
        value: null,
        subtext: null,
        isChart: true,
        chartData: [
            { name: 'Mon', score: 82 },
            { name: 'Tue', score: 84 },
            { name: 'Wed', score: 83 },
            { name: 'Thu', score: 85 },
            { name: 'Fri', score: 88 },
        ]
    }
};

const DEFAULT_LAYOUT: DashboardWidget[] = [
    { id: '1', title: 'Global Compliance', type: 'METRIC', dataSource: 'GLOBAL_COMPLIANCE', size: 'SMALL' },
    { id: '2', title: 'Critical Risks', type: 'METRIC', dataSource: 'CRITICAL_RISKS', size: 'SMALL' },
    { id: '3', title: 'Total Assets', type: 'METRIC', dataSource: 'TOTAL_ASSETS', size: 'SMALL' },
    { id: '4', title: 'SaaS Users', type: 'METRIC', dataSource: 'SAAS_USERS', size: 'SMALL' },
    { id: '5', title: 'Compliance Status', type: 'PIE_CHART', dataSource: 'GLOBAL_COMPLIANCE', size: 'MEDIUM' },
    { id: '6', title: 'Assets by Provider', type: 'BAR_CHART', dataSource: 'ASSETS_BY_PROVIDER', size: 'MEDIUM' },
    { id: '7', title: 'Risk Score Trend', type: 'LINE_CHART', dataSource: 'RISK_TREND', size: 'FULL' },
];

const Dashboard: React.FC = () => {
    const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState('ALL');

    // New Widget Form State
    const [newWidgetTitle, setNewWidgetTitle] = useState('');
    const [newWidgetType, setNewWidgetType] = useState<WidgetType>('METRIC');
    const [newWidgetSource, setNewWidgetSource] = useState<DataSource>('GLOBAL_COMPLIANCE');
    const [newWidgetSize, setNewWidgetSize] = useState<WidgetSize>('SMALL');

    const handleAddWidget = () => {
        const newWidget: DashboardWidget = {
            id: Date.now().toString(),
            title: newWidgetTitle || 'New Widget',
            type: newWidgetType,
            dataSource: newWidgetSource,
            size: newWidgetSize
        };
        setWidgets([...widgets, newWidget]);
        setIsAddModalOpen(false);
        setNewWidgetTitle(''); // Reset form
    };

    const handleRemoveWidget = (id: string) => {
        setWidgets(widgets.filter(w => w.id !== id));
    };

    // Helper function to return data based on the selected filter
    const getWidgetData = (sourceKey: DataSource) => {
        const baseData = DATA_SOURCES[sourceKey];
        if (selectedConnector === 'ALL') return baseData;

        // Clone to modify without mutating constant
        const filtered = JSON.parse(JSON.stringify(baseData));

        // Mock Logic to simulate filtering data
        if (selectedConnector === 'AWS') {
            if (sourceKey === 'GLOBAL_COMPLIANCE') { filtered.value = '92.1%'; filtered.subtext = 'High adherence'; filtered.chartData = [{ name: 'Compliant', value: 200 }, { name: 'Non-Compliant', value: 15 }]; }
            if (sourceKey === 'CRITICAL_RISKS') { filtered.value = '3'; filtered.subtext = 'S3 Public Access'; }
            if (sourceKey === 'TOTAL_ASSETS') { filtered.value = '460'; filtered.subtext = 'US-East-1'; }
            if (sourceKey === 'SAAS_USERS') { filtered.value = '0'; filtered.subtext = 'N/A'; }
            if (sourceKey === 'ASSETS_BY_PROVIDER') {
                filtered.chartData = [
                    { name: 'Compute', AWS: 120 },
                    { name: 'Storage', AWS: 90 },
                    { name: 'Network', AWS: 50 },
                    { name: 'Identity', AWS: 200 },
                ];
            }
            if (sourceKey === 'RISK_TREND') {
                filtered.chartData = [{ name: 'Mon', score: 90 }, { name: 'Tue', score: 91 }, { name: 'Wed', score: 91 }, { name: 'Thu', score: 92 }, { name: 'Fri', score: 92 }];
            }
        } else if (selectedConnector === 'AZURE') {
            if (sourceKey === 'GLOBAL_COMPLIANCE') { filtered.value = '81.4%'; filtered.subtext = 'Needs improvement'; filtered.chartData = [{ name: 'Compliant', value: 150 }, { name: 'Non-Compliant', value: 40 }]; }
            if (sourceKey === 'CRITICAL_RISKS') { filtered.value = '7'; filtered.subtext = 'Storage Access'; }
            if (sourceKey === 'TOTAL_ASSETS') { filtered.value = '300'; filtered.subtext = 'West Europe'; }
            if (sourceKey === 'SAAS_USERS') { filtered.value = '0'; filtered.subtext = 'N/A'; }
            if (sourceKey === 'ASSETS_BY_PROVIDER') {
                filtered.chartData = [
                    { name: 'Compute', Azure: 80 },
                    { name: 'Storage', Azure: 40 },
                    { name: 'Network', Azure: 30 },
                    { name: 'Identity', Azure: 150 },
                ];
            }
             if (sourceKey === 'RISK_TREND') {
                filtered.chartData = [{ name: 'Mon', score: 75 }, { name: 'Tue', score: 78 }, { name: 'Wed', score: 77 }, { name: 'Thu', score: 80 }, { name: 'Fri', score: 81 }];
            }
        } else if (selectedConnector === 'SAAS') {
            if (sourceKey === 'GLOBAL_COMPLIANCE') { filtered.value = 'N/A'; filtered.subtext = 'Identity focus'; }
            if (sourceKey === 'CRITICAL_RISKS') { filtered.value = '2'; filtered.subtext = 'MFA Disabled'; }
            if (sourceKey === 'TOTAL_ASSETS') { filtered.value = '672'; filtered.subtext = 'Users & Repos'; }
            if (sourceKey === 'SAAS_USERS') { filtered.value = '890'; filtered.subtext = 'Active'; }
             if (sourceKey === 'ASSETS_BY_PROVIDER') {
                filtered.chartData = [
                    { name: 'Identity', SaaS: 300 },
                    { name: 'Storage', SaaS: 50 },
                ];
            }
        }

        return filtered;
    };

    const getGridClass = (size: WidgetSize) => {
        switch (size) {
            case 'SMALL': return 'col-span-1';
            case 'MEDIUM': return 'col-span-1 lg:col-span-2';
            case 'LARGE': return 'col-span-1 lg:col-span-3';
            case 'FULL': return 'col-span-1 lg:col-span-4';
            default: return 'col-span-1';
        }
    };

    const renderWidgetContent = (widget: DashboardWidget) => {
        const data = getWidgetData(widget.dataSource);

        if (widget.type === 'METRIC') {
            return (
                <div className="flex items-start justify-between h-full">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{widget.title}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.value}</h3>
                        {data.subtext && (
                            <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs font-medium">
                                <Activity className="w-3 h-3" />
                                <span>{data.subtext}</span>
                            </div>
                        )}
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <LayoutGrid className="w-6 h-6 text-indigo-600" />
                    </div>
                </div>
            );
        }

        if (widget.type === 'PIE_CHART') {
            return (
                <div className="h-full w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (widget.type === 'BAR_CHART') {
            return (
                <div className="h-full w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
                            <YAxis stroke="#94a3b8" fontSize={12}/>
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Legend />
                            {(selectedConnector === 'ALL' || selectedConnector === 'AWS') && <Bar dataKey="AWS" stackId="a" fill="#f59e0b" />}
                            {(selectedConnector === 'ALL' || selectedConnector === 'AZURE') && <Bar dataKey="Azure" stackId="a" fill="#0ea5e9" />}
                            {(selectedConnector === 'ALL' || selectedConnector === 'SAAS') && <Bar dataKey="SaaS" stackId="a" fill="#6366f1" />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (widget.type === 'LINE_CHART') {
            return (
                <div className="h-full w-full min-h-[200px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis domain={[0, 100]} stroke="#94a3b8" />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 8}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        return <div className="text-red-500">Unknown Widget Type</div>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Security Overview</h2>
                    <p className="text-slate-500">Customizable dashboard for global visibility.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Filter Dropdown */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select 
                            value={selectedConnector}
                            onChange={(e) => setSelectedConnector(e.target.value)}
                            className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer focus:ring-0 border-none p-0 pr-2"
                        >
                            <option value="ALL">All Connectors</option>
                            <option value="AWS">AWS (Production)</option>
                            <option value="AZURE">Azure (Corp)</option>
                            <option value="SAAS">SaaS Apps</option>
                        </select>
                    </div>

                    <button 
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditMode ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                        {isEditMode ? <CheckCircle className="w-4 h-4"/> : <Settings className="w-4 h-4" />}
                        {isEditMode ? 'Done Customizing' : 'Customize Dashboard'}
                    </button>
                    {isEditMode && (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Widget
                        </button>
                    )}
                </div>
            </div>

            {/* Dynamic Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
                {widgets.map((widget) => (
                    <Card key={widget.id} className={`relative p-5 flex flex-col ${getGridClass(widget.size)} ${isEditMode ? 'border-2 border-dashed border-slate-300' : ''}`}>
                        {isEditMode && (
                            <button 
                                onClick={() => handleRemoveWidget(widget.id)}
                                className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 z-10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        {widget.type !== 'METRIC' && (
                             <h3 className="text-lg font-semibold text-slate-900 mb-4">{widget.title}</h3>
                        )}
                        <div className="flex-1">
                            {renderWidgetContent(widget)}
                        </div>
                    </Card>
                ))}
                
                {isEditMode && (
                    <button 
                         onClick={() => setIsAddModalOpen(true)}
                        className="col-span-1 h-32 md:h-auto border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all bg-slate-50/50"
                    >
                        <Plus className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">Add Widget</span>
                    </button>
                )}
            </div>

            {/* Add Widget Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Add New Widget</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Widget Title</label>
                                <input 
                                    type="text" 
                                    value={newWidgetTitle}
                                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                                    placeholder="e.g. Weekly Compliance"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Visualization Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    <button onClick={() => setNewWidgetType('METRIC')} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-50 ${newWidgetType === 'METRIC' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                                        <LayoutGrid className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">Metric</span>
                                    </button>
                                    <button onClick={() => setNewWidgetType('BAR_CHART')} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-50 ${newWidgetType === 'BAR_CHART' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                                        <BarChart3 className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">Bar</span>
                                    </button>
                                    <button onClick={() => setNewWidgetType('PIE_CHART')} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-50 ${newWidgetType === 'PIE_CHART' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                                        <PieIcon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">Pie</span>
                                    </button>
                                    <button onClick={() => setNewWidgetType('LINE_CHART')} className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-50 ${newWidgetType === 'LINE_CHART' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                                        <Activity className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">Line</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data Source</label>
                                <select 
                                    value={newWidgetSource}
                                    onChange={(e) => setNewWidgetSource(e.target.value as DataSource)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    {Object.entries(DATA_SOURCES).map(([key, data]) => (
                                        <option key={key} value={key}>{data.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                                <select 
                                    value={newWidgetSize}
                                    onChange={(e) => setNewWidgetSize(e.target.value as WidgetSize)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="SMALL">Small (1 Column)</option>
                                    <option value="MEDIUM">Medium (2 Columns)</option>
                                    <option value="LARGE">Large (3 Columns)</option>
                                    <option value="FULL">Full Width (4 Columns)</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900">Cancel</button>
                            <button onClick={handleAddWidget} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Add Widget</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;