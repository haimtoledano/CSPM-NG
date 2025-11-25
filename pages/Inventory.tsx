
import React, { useState } from 'react';
import { Asset, SourceType, AssetCategory } from '../types';
import { Card, Badge, RiskBadge } from '../components/Widgets';
import { Search, Filter, Cpu, Database, User, Globe, Sparkles, X, Tag, Code, Copy, ShieldAlert, Terminal, Wrench, Bug, Network, Share2 } from 'lucide-react';
import { analyzeAssetRisk, generateRemediationCode } from '../services/geminiService';

// Mock Data
const MOCK_ASSETS: Asset[] = [
    {
        id: '1',
        global_id: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0abcdef1234567890',
        name: 'prod-api-server-01',
        source_type: SourceType.AWS,
        asset_category: AssetCategory.COMPUTE,
        region: 'us-east-1',
        tags: { env: 'prod', owner: 'platform-team', cost_center: '1001' },
        security_posture: {
            risk_score: 85,
            vulnerabilities: ['CVE-2023-44487', 'CVE-2023-4863'],
            misconfigurations: ['Public IP Assigned', 'Port 22 Open (0.0.0.0/0)']
        },
        raw_metadata: { 
            instanceType: 't3.medium', 
            state: 'running',
            publicIp: '54.1.2.3',
            privateIp: '10.0.0.5',
            securityGroups: ['sg-12345 (launch-wizard-1)']
        },
        related_assets: ['2', 'sg-1'] // Connected to Storage and Security Group
    },
    {
        id: '2',
        global_id: '/subscriptions/sub-123/resourceGroups/rg-prod/providers/Microsoft.Storage/storageAccounts/prodassets',
        name: 'prodassets-blob',
        source_type: SourceType.AZURE,
        asset_category: AssetCategory.STORAGE,
        region: 'eastus',
        tags: { env: 'prod', data: 'sensitive' },
        security_posture: {
            risk_score: 95,
            vulnerabilities: [],
            misconfigurations: ['Blob Public Access Allowed', 'Missing Encryption at Rest']
        },
        raw_metadata: { sku: 'Standard_LRS', kind: 'StorageV2', accessTier: 'Hot' },
        related_assets: ['1']
    },
    {
        id: '3',
        global_id: 'gh-user-88229',
        name: 'dave.admin@company.com',
        source_type: SourceType.SAAS_GITHUB,
        asset_category: AssetCategory.IDENTITY,
        region: 'global',
        tags: { role: 'admin', team: 'devops' },
        security_posture: {
            risk_score: 15,
            vulnerabilities: [],
            misconfigurations: []
        },
        raw_metadata: { mfa_enabled: true, admin: true, created_at: '2022-01-01' },
        related_assets: ['4']
    },
    {
        id: '4',
        global_id: 'zoom-user-112233',
        name: 'sarah.vp@company.com',
        source_type: SourceType.SAAS_ZOOM,
        asset_category: AssetCategory.IDENTITY,
        region: 'global',
        tags: { dept: 'executive' },
        security_posture: {
            risk_score: 60,
            vulnerabilities: [],
            misconfigurations: ['No PMI Password', 'Cloud Recording Auto-Delete Off']
        },
        raw_metadata: { type: 'Licensed', pmi: 1234567890, timezone: 'America/New_York' },
        related_assets: []
    },
    // Extra mock asset for graph demo
    {
        id: 'sg-1',
        global_id: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-12345',
        name: 'launch-wizard-1',
        source_type: SourceType.AWS,
        asset_category: AssetCategory.NETWORK,
        region: 'us-east-1',
        tags: { type: 'security-group' },
        security_posture: { risk_score: 80, vulnerabilities: [], misconfigurations: ['Port 22 Open'] },
        raw_metadata: {},
        related_assets: ['1']
    }
];

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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'ai' | 'graph'>('details');
    const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({}); // Cache analysis by asset ID
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Remediation State
    const [remediationCode, setRemediationCode] = useState('');
    const [isGeneratingFix, setIsGeneratingFix] = useState(false);
    const [selectedIssueForFix, setSelectedIssueForFix] = useState<string | null>(null);

    const filteredAssets = MOCK_ASSETS.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.source_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRowClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setActiveTab('details');
        setRemediationCode('');
        setSelectedIssueForFix(null);
    };

    const handleAnalyzeClick = async (e: React.MouseEvent, asset: Asset) => {
        e.stopPropagation();
        setSelectedAsset(asset);
        setActiveTab('ai');
        if (!aiAnalysis[asset.id]) {
            await runAnalysis(asset);
        }
    };

    const runAnalysis = async (asset: Asset) => {
        setIsAnalyzing(true);
        const result = await analyzeAssetRisk(asset);
        setAiAnalysis(prev => ({ ...prev, [asset.id]: result }));
        setIsAnalyzing(false);
    };

    const handleRemediate = async (issue: string) => {
        if (!selectedAsset) return;
        setSelectedIssueForFix(issue);
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

        // Find related assets
        const relatedIds = selectedAsset.related_assets || [];
        const relatedNodes = MOCK_ASSETS.filter(a => relatedIds.includes(a.id));

        return (
            <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 bg-slate-800/80 p-2 rounded text-xs text-white backdrop-blur-sm">
                    <p className="font-bold">Topology Map</p>
                    <p className="text-slate-400">Visualizing blast radius</p>
                </div>
                
                <svg width="100%" height="100%" viewBox="0 0 400 300" className="flex-1 cursor-grab active:cursor-grabbing">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                    
                    {/* Edges */}
                    {relatedNodes.map((node, i) => {
                        const angle = (i / relatedNodes.length) * 2 * Math.PI;
                        const x = center.x + radius * Math.cos(angle);
                        const y = center.y + radius * Math.sin(angle);
                        return (
                            <line 
                                key={`line-${node.id}`}
                                x1={center.x} y1={center.y}
                                x2={x} y2={y}
                                stroke="#475569" 
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}

                    {/* Related Nodes */}
                    {relatedNodes.map((node, i) => {
                        const angle = (i / relatedNodes.length) * 2 * Math.PI;
                        const x = center.x + radius * Math.cos(angle);
                        const y = center.y + radius * Math.sin(angle);
                        
                        return (
                            <g key={node.id} onClick={() => setSelectedAsset(node)} className="cursor-pointer hover:opacity-80 transition-opacity">
                                <circle cx={x} cy={y} r="20" fill="#1e293b" stroke={node.security_posture.risk_score > 70 ? '#f43f5e' : '#10b981'} strokeWidth="2" />
                                <text x={x} y={y + 35} textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-mono">{node.name}</text>
                                {/* Simple Icon Simulation */}
                                <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                                    {node.asset_category.charAt(0)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Center Node (Selected) */}
                    <g>
                        <circle cx={center.x} cy={center.y} r="25" fill="#4f46e5" stroke="white" strokeWidth="3" className="drop-shadow-lg" />
                        <text x={center.x} y={center.y + 40} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{selectedAsset.name}</text>
                        <text x={center.x} y={center.y + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                             {selectedAsset.asset_category.charAt(0)}
                        </text>
                    </g>
                </svg>
                
                <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Secure</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> High Risk</span>
                    </div>
                    <span>{relatedNodes.length} Connections</span>
                </div>
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
                <div className="flex gap-2">
                     <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                        <Filter className="w-4 h-4 text-slate-500" />
                        Filters
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search inventory..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Table List */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <Card className="flex-1 overflow-hidden flex flex-col">
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
                                            <td className="px-6 py-4">
                                                <Badge variant="neutral">{asset.source_type}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <RiskBadge score={asset.security_posture.risk_score} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-500">
                                                    {asset.security_posture.misconfigurations.length} Issues
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={(e) => handleAnalyzeClick(e, asset)}
                                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    Analyze
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
                            <span>Showing {filteredAssets.length} assets</span>
                            <span>Sync Status: Up to date</span>
                        </div>
                    </Card>
                </div>

                {/* Side Panel (Asset Details & AI) */}
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
                                {/* Header */}
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
                                    
                                    {/* Tabs */}
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mt-4">
                                        <button 
                                            onClick={() => setActiveTab('details')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Code className="w-3 h-3" /> Details
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('graph')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'graph' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Share2 className="w-3 h-3" /> Graph
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('ai')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Sparkles className="w-3 h-3" /> AI Analysis
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                                    {activeTab === 'details' && (
                                        <div className="space-y-6">
                                            {/* Security Summary */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Security Posture</h4>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-500">Risk Score</span>
                                                        <span className={`text-2xl font-bold ${selectedAsset.security_posture.risk_score > 70 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {selectedAsset.security_posture.risk_score}
                                                        </span>
                                                    </div>
                                                    <div className="w-px h-10 bg-slate-200"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-500">Misconfigs</span>
                                                        <span className="text-2xl font-bold text-slate-700">
                                                            {selectedAsset.security_posture.misconfigurations.length}
                                                        </span>
                                                    </div>
                                                    <div className="w-px h-10 bg-slate-200"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-500">Vulnerabilities</span>
                                                        <span className={`text-2xl font-bold ${selectedAsset.security_posture.vulnerabilities.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                            {selectedAsset.security_posture.vulnerabilities.length}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Vulnerabilities List */}
                                                {selectedAsset.security_posture.vulnerabilities.length > 0 && (
                                                    <div className="space-y-2 mb-4">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Known Vulnerabilities</h5>
                                                        {selectedAsset.security_posture.vulnerabilities.map((vuln, i) => (
                                                            <div key={i} className="flex flex-col gap-2 text-xs bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                                <div className="flex items-start gap-2 text-amber-700 font-medium">
                                                                    <Bug className="w-4 h-4 shrink-0 mt-0.5" />
                                                                    <span>{vuln}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Misconfigurations List */}
                                                {selectedAsset.security_posture.misconfigurations.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Misconfigurations</h5>
                                                        {selectedAsset.security_posture.misconfigurations.map((issue, i) => (
                                                            <div key={i} className="flex flex-col gap-2 text-xs bg-rose-50 p-2 rounded-lg border border-rose-100">
                                                                <div className="flex items-start gap-2 text-rose-700 font-medium">
                                                                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                                                    <span>{issue}</span>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleRemediate(issue)}
                                                                    className="ml-6 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline w-fit"
                                                                >
                                                                    <Wrench className="w-3 h-3" />
                                                                    Generate Fix
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Code Fix Modal Overlay (Inline) */}
                                            {remediationCode && (
                                                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 animate-fadeIn relative">
                                                    <div className="flex items-center justify-between mb-2 text-emerald-400">
                                                        <div className="flex items-center gap-2 text-xs font-mono">
                                                            <Terminal className="w-4 h-4" />
                                                            {selectedIssueForFix ? 'Proposed Remediation' : 'AI Generated Code'}
                                                        </div>
                                                        <button 
                                                            onClick={() => setRemediationCode('')}
                                                            className="text-slate-500 hover:text-white"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                                        {remediationCode}
                                                    </pre>
                                                    <div className="mt-3 flex justify-end">
                                                        <button 
                                                            onClick={() => navigator.clipboard.writeText(remediationCode)}
                                                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <Copy className="w-3 h-3" /> Copy Code
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {isGeneratingFix && (
                                                <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500 animate-pulse">
                                                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                                                    Generating Infrastructure Code...
                                                </div>
                                            )}

                                            {/* Tags */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Tag className="w-3 h-3" /> Resource Tags
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(selectedAsset.tags).map(([key, value]) => (
                                                        <span key={key} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1">
                                                            <span className="font-semibold text-slate-800">{key}:</span> {value}
                                                        </span>
                                                    ))}
                                                    {Object.keys(selectedAsset.tags).length === 0 && (
                                                        <span className="text-xs text-slate-400 italic">No tags found.</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Raw Metadata */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <Code className="w-3 h-3" /> Raw Configuration
                                                </h4>
                                                <div className="relative group">
                                                    <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-60 border border-slate-800 shadow-inner">
                                                        {JSON.stringify(selectedAsset.raw_metadata, null, 2)}
                                                    </pre>
                                                    <button className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 rounded hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'graph' && (
                                        <div className="h-full">
                                            {renderTopologyGraph()}
                                        </div>
                                    )}

                                    {activeTab === 'ai' && (
                                        <div className="h-full flex flex-col">
                                            {aiAnalysis[selectedAsset.id] ? (
                                                <div className="prose prose-sm prose-slate max-w-none">
                                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4 flex items-start gap-3">
                                                        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-indigo-900 m-0">Gemini Analysis</h4>
                                                            <p className="text-xs text-indigo-700 m-0 mt-1">Generated based on asset configuration and CSPM best practices.</p>
                                                        </div>
                                                    </div>
                                                    <div dangerouslySetInnerHTML={{ __html: aiAnalysis[selectedAsset.id].replace(/\n/g, '<br/>').replace(/### (.*)/g, '<h3 class="font-bold text-slate-800 mt-4 mb-2 text-sm uppercase tracking-wide">$1</h3>').replace(/- (.*)/g, '<li class="ml-4 list-disc text-slate-600">$1</li>').replace(/\*\*(.*)\*\*/g, '<strong class="text-slate-900">$1</strong>') }} />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 py-10">
                                                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                                                        <Sparkles className="w-8 h-8 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">Analyze with Gemini</h4>
                                                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                                                            Generate a comprehensive security report identifying hidden risks and remediation steps.
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => runAnalysis(selectedAsset)}
                                                        disabled={isAnalyzing}
                                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-70"
                                                    >
                                                        {isAnalyzing ? (
                                                            <>
                                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                                Analyzing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-4 h-4" />
                                                                Run Security Analysis
                                                            </>
                                                        )}
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
