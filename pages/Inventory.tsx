import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Asset, SourceType, AssetCategory } from '../types';
import { Card, Badge, RiskBadge } from '../components/Widgets';
import { apiService } from '../services/apiService';
import { Search, Filter, Cpu, Database, User, Globe, Sparkles, X, Tag, Code, Copy, ShieldAlert, Terminal, Wrench, Bug, Network, Share2, Loader2 } from 'lucide-react';
import { analyzeAssetRisk, generateRemediationCode } from '../services/geminiService';

const AssetIcon = ({ type }: { type: AssetCategory }) => {
    switch (type) {
        case AssetCategory.COMPUTE: return <Cpu className="w-4 h-4 text-indigo-500" />;
        case AssetCategory.STORAGE: return <Database className="w-4 h-4 text-amber-500" />;
        case AssetCategory.IDENTITY: return <User className="w-4 h-4 text-pink-500" />;
        case AssetCategory.NETWORK: return <Network className="w-4 h-4 text-cyan-500" />;
        default: return <Globe className="w-4 h-4 text-slate-500" />;
    }
};

const Inventory: React.FC = () => {
    // Data State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'ai' | 'graph'>('details');
    const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({}); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [remediationCode, setRemediationCode] = useState('');
    const [isGeneratingFix, setIsGeneratingFix] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const data = await apiService.getAssets();
                setAssets(data);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchAssets();
    }, []);

    // Performance: Memoized Filtering
    const filteredAssets = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return assets.filter(a => 
            a.name.toLowerCase().includes(lowerSearch) || 
            a.source_type.toLowerCase().includes(lowerSearch) ||
            a.global_id.toLowerCase().includes(lowerSearch)
        );
    }, [assets, searchTerm]);

    // Handlers
    const handleRowClick = useCallback((asset: Asset) => {
        setSelectedAsset(asset);
        setActiveTab('details');
        setRemediationCode('');
    }, []);

    const handleAnalyzeClick = useCallback(async (e: React.MouseEvent, asset: Asset) => {
        e.stopPropagation();
        setSelectedAsset(asset);
        setActiveTab('ai');
        if (!aiAnalysis[asset.id]) {
            setIsAnalyzing(true);
            const result = await analyzeAssetRisk(asset);
            setAiAnalysis(prev => ({ ...prev, [asset.id]: result }));
            setIsAnalyzing(false);
        }
    }, [aiAnalysis]);

    const handleRemediate = async (issue: string) => {
        if (!selectedAsset) return;
        setIsGeneratingFix(true);
        const code = await generateRemediationCode(issue, selectedAsset);
        setRemediationCode(code);
        setIsGeneratingFix(false);
    };

    // --- GRAPH RENDERER ---
    const renderTopologyGraph = () => {
        if (!selectedAsset) return null;
        const center = { x: 200, y: 150 };
        const radius = 100;
        const relatedIds = selectedAsset.related_assets || [];
        const relatedNodes = assets.filter(a => relatedIds.includes(a.id));

        return (
            <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 bg-slate-800/80 p-2 rounded text-xs text-white backdrop-blur-sm">
                    <p className="font-bold">Topology Map</p>
                    <p className="text-slate-400">Visualizing blast radius</p>
                </div>
                <svg width="100%" height="100%" viewBox="0 0 400 300" className="flex-1">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                    {relatedNodes.map((node, i) => {
                        const angle = (i / relatedNodes.length) * 2 * Math.PI;
                        const x = center.x + radius * Math.cos(angle);
                        const y = center.y + radius * Math.sin(angle);
                        return (
                            <React.Fragment key={node.id}>
                                <line x1={center.x} y1={center.y} x2={x} y2={y} stroke="#475569" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                                <g onClick={() => setSelectedAsset(node)} className="cursor-pointer hover:opacity-80">
                                    <circle cx={x} cy={y} r="20" fill="#1e293b" stroke={node.security_posture.risk_score > 70 ? '#f43f5e' : '#10b981'} strokeWidth="2" />
                                    <text x={x} y={y + 35} textAnchor="middle" fill="#94a3b8" fontSize="10">{node.name}</text>
                                    <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{node.asset_category.charAt(0)}</text>
                                </g>
                            </React.Fragment>
                        );
                    })}
                    <g>
                        <circle cx={center.x} cy={center.y} r="25" fill="#4f46e5" stroke="white" strokeWidth="3" />
                        <text x={center.x} y={center.y + 40} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{selectedAsset.name}</text>
                        <text x={center.x} y={center.y + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{selectedAsset.asset_category.charAt(0)}</text>
                    </g>
                </svg>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Asset Inventory</h2>
                    <p className="text-slate-500">Discover, audit, and analyze resources across clouds.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search assets..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* List View */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <Card className="flex-1 overflow-hidden flex flex-col">
                        {isLoadingData ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 font-medium text-slate-500">Asset Name</th>
                                            <th className="px-6 py-4 font-medium text-slate-500">Source</th>
                                            <th className="px-6 py-4 font-medium text-slate-500">Risk Score</th>
                                            <th className="px-6 py-4 font-medium text-slate-500">Misconfigurations</th>
                                            <th className="px-6 py-4 font-medium text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAssets.map((asset) => (
                                            <tr 
                                                key={asset.id} 
                                                onClick={() => handleRowClick(asset)}
                                                className={`transition-colors cursor-pointer ${
                                                    selectedAsset?.id === asset.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${selectedAsset?.id === asset.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                                            <AssetIcon type={asset.asset_category} />
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium ${selectedAsset?.id === asset.id ? 'text-indigo-900' : 'text-slate-900'}`}>{asset.name}</p>
                                                            <p className="text-xs text-slate-500">{asset.region}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><Badge variant="neutral">{asset.source_type}</Badge></td>
                                                <td className="px-6 py-4"><RiskBadge score={asset.security_posture.risk_score} /></td>
                                                <td className="px-6 py-4"><span className="text-slate-500">{asset.security_posture.misconfigurations.length} Issues</span></td>
                                                <td className="px-6 py-4">
                                                    <button onClick={(e) => handleAnalyzeClick(e, asset)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                                        <Sparkles className="w-3 h-3" /> Analyze
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
                            <span>Showing {filteredAssets.length} assets</span>
                            <span>Sync Status: Live (SQL)</span>
                        </div>
                    </Card>
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-1 h-full flex flex-col">
                    <Card className="h-full flex flex-col overflow-hidden relative border-l-4 border-l-indigo-500 shadow-xl">
                        {!selectedAsset ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Database className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">No Asset Selected</h3>
                                <p className="text-sm mt-2">Click on an asset row to view configuration details, tags, and AI security analysis.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full animate-fadeIn">
                                <div className="p-6 border-b border-slate-200 bg-white">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <AssetIcon type={selectedAsset.asset_category} />
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 leading-tight">{selectedAsset.name}</h3>
                                                <p className="text-xs text-slate-500 font-mono mt-1">{selectedAsset.global_id}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mt-4">
                                        {['details', 'graph', 'ai'].map((tab) => (
                                            <button 
                                                key={tab}
                                                onClick={() => setActiveTab(tab as any)}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all uppercase ${activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                                    {activeTab === 'details' && (
                                        <div className="space-y-6">
                                            {/* Security Summary */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="text-center">
                                                        <span className="text-xs text-slate-500 block">Risk Score</span>
                                                        <span className={`text-2xl font-bold ${selectedAsset.security_posture.risk_score > 70 ? 'text-rose-600' : 'text-emerald-600'}`}>{selectedAsset.security_posture.risk_score}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs text-slate-500 block">Issues</span>
                                                        <span className="text-2xl font-bold text-slate-700">{selectedAsset.security_posture.misconfigurations.length}</span>
                                                    </div>
                                                </div>
                                                {selectedAsset.security_posture.misconfigurations.map((issue, i) => (
                                                    <div key={i} className="flex flex-col gap-2 text-xs bg-rose-50 p-2 rounded-lg border border-rose-100 mb-2">
                                                        <div className="flex items-start gap-2 text-rose-700 font-medium">
                                                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <span>{issue}</span>
                                                        </div>
                                                        <button onClick={() => handleRemediate(issue)} className="ml-6 flex items-center gap-1 text-xs text-indigo-600 hover:underline w-fit">
                                                            <Wrench className="w-3 h-3" /> Generate Fix
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Remediation Code Block */}
                                            {remediationCode && (
                                                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-emerald-400 text-xs font-mono">Suggested Fix</span>
                                                        <button onClick={() => setRemediationCode('')}><X className="w-4 h-4 text-slate-500" /></button>
                                                    </div>
                                                    <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{remediationCode}</pre>
                                                </div>
                                            )}
                                            {isGeneratingFix && <div className="text-xs text-indigo-600 animate-pulse">Generating code...</div>}
                                            
                                            {/* Raw Metadata */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuration</h4>
                                                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-60">
                                                    {JSON.stringify(selectedAsset.raw_metadata, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'graph' && renderTopologyGraph()}
                                    {activeTab === 'ai' && (
                                        <div className="prose prose-sm max-w-none">
                                            {aiAnalysis[selectedAsset.id] ? (
                                                <div dangerouslySetInnerHTML={{ __html: aiAnalysis[selectedAsset.id].replace(/\n/g, '<br/>') }} />
                                            ) : (
                                                <div className="text-center py-10">
                                                    <button onClick={() => handleAnalyzeClick({} as any, selectedAsset)} disabled={isAnalyzing} className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                                                        {isAnalyzing ? 'Analyzing...' : 'Run Security Analysis'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Inventory;