import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/Widgets';
import { DashboardWidget, WidgetType, DataSource, WidgetSize, Asset } from '../types';
import { apiService } from '../services/apiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { CheckCircle, Plus, Settings, Trash2, X, BarChart3, PieChart as PieIcon, Activity, LayoutGrid, Filter } from 'lucide-react';

const DEFAULT_LAYOUT: DashboardWidget[] = [
    { id: '1', title: 'Global Compliance', type: 'METRIC', dataSource: 'GLOBAL_COMPLIANCE', size: 'SMALL' },
    { id: '2', title: 'Critical Risks', type: 'METRIC', dataSource: 'CRITICAL_RISKS', size: 'SMALL' },
    { id: '3', title: 'Total Assets', type: 'METRIC', dataSource: 'TOTAL_ASSETS', size: 'SMALL' },
    { id: '6', title: 'Assets by Provider', type: 'BAR_CHART', dataSource: 'ASSETS_BY_PROVIDER', size: 'MEDIUM' },
    { id: '7', title: 'Risk Score Trend', type: 'LINE_CHART', dataSource: 'RISK_TREND', size: 'FULL' },
];

const Dashboard: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState('ALL');

    // Load Live Data
    useEffect(() => {
        apiService.getAssets().then(setAssets);
    }, []);

    // Performance: Memoize Data Calculations so they only run when assets change
    const computedData = useMemo(() => {
        const filtered = selectedConnector === 'ALL' 
            ? assets 
            : assets.filter(a => a.source_type === selectedConnector);

        const totalAssets = filtered.length;
        const criticalRisks = filtered.filter(a => a.security_posture.risk_score > 75).length;
        const compliantCount = filtered.filter(a => a.security_posture.risk_score < 40).length;
        
        // Group for Charts
        const providerCounts = filtered.reduce((acc, curr) => {
            acc[curr.source_type] = (acc[curr.source_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.keys(providerCounts).map(key => ({
            name: key,
            value: providerCounts[key]
        }));

        return {
            totalAssets,
            criticalRisks,
            complianceRate: totalAssets ? Math.round((compliantCount / totalAssets) * 100) : 100,
            chartData
        };
    }, [assets, selectedConnector]);

    // Simplified Widget Renderer
    const renderWidgetContent = (widget: DashboardWidget) => {
        if (widget.dataSource === 'TOTAL_ASSETS') {
            return (
                <div className="flex justify-between items-center h-full">
                    <div>
                        <h3 className="text-3xl font-bold text-slate-900">{computedData.totalAssets}</h3>
                        <p className="text-sm text-slate-500">Managed Resources</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full"><LayoutGrid className="w-6 h-6 text-indigo-600"/></div>
                </div>
            );
        }
        if (widget.dataSource === 'CRITICAL_RISKS') {
            return (
                <div className="flex justify-between items-center h-full">
                    <div>
                        <h3 className="text-3xl font-bold text-rose-600">{computedData.criticalRisks}</h3>
                        <p className="text-sm text-slate-500">Requires Attention</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-full"><Activity className="w-6 h-6 text-rose-600"/></div>
                </div>
            );
        }
        if (widget.dataSource === 'GLOBAL_COMPLIANCE') {
             return (
                <div className="flex justify-between items-center h-full">
                    <div>
                        <h3 className="text-3xl font-bold text-emerald-600">{computedData.complianceRate}%</h3>
                        <p className="text-sm text-slate-500">Compliance Score</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full"><CheckCircle className="w-6 h-6 text-emerald-600"/></div>
                </div>
            );
        }
        
        if (widget.type === 'BAR_CHART') {
            return (
                <div className="h-full w-full min-h-[200px]">
                    <ResponsiveContainer>
                        <BarChart data={computedData.chartData}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
                            <YAxis stroke="#94a3b8" fontSize={12}/>
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        // Mock Trend for demo visuals
        if (widget.type === 'LINE_CHART') {
             const mockTrend = [
                { name: 'Mon', score: 82 }, { name: 'Tue', score: 84 }, { name: 'Wed', score: 83 },
                { name: 'Thu', score: 85 }, { name: 'Fri', score: computedData.complianceRate }
            ];
            return (
                <div className="h-full w-full min-h-[200px]">
                     <ResponsiveContainer>
                        <LineChart data={mockTrend}>
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis domain={[0, 100]} stroke="#94a3b8" />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        return <div className="text-slate-400 text-sm">Widget configured. Add data source logic.</div>;
    };

    const getGridClass = (size: WidgetSize) => {
        switch (size) {
            case 'SMALL': return 'col-span-1';
            case 'MEDIUM': return 'col-span-1 lg:col-span-2';
            case 'FULL': return 'col-span-1 lg:col-span-4';
            default: return 'col-span-1';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Security Dashboard</h2>
                <div className="flex gap-2">
                    <select 
                        value={selectedConnector}
                        onChange={(e) => setSelectedConnector(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">All Sources</option>
                        <option value="AWS">AWS</option>
                        <option value="AZURE">Azure</option>
                    </select>
                    <button onClick={() => setIsEditMode(!isEditMode)} className="p-2 border rounded-lg hover:bg-slate-50 transition-colors">
                        {isEditMode ? <CheckCircle className="w-5 h-5 text-emerald-600"/> : <Settings className="w-5 h-5 text-slate-500"/>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {widgets.map((widget) => (
                    <Card key={widget.id} className={`p-6 flex flex-col ${getGridClass(widget.size)} ${isEditMode ? 'border-dashed border-2 border-indigo-300' : ''}`}>
                        {widget.type !== 'METRIC' && <h3 className="text-lg font-semibold text-slate-900 mb-4">{widget.title}</h3>}
                        <div className="flex-1">
                            {renderWidgetContent(widget)}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;