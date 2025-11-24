import React, { useState } from 'react';
import { Asset, SourceType, AssetCategory } from '../types';
import { Card, Badge, RiskBadge } from '../components/Widgets';
import { Search, Filter, Cpu, Database, User, Globe, Sparkles } from 'lucide-react';
import { analyzeAssetRisk } from '../services/geminiService';

// Mock Data
const MOCK_ASSETS: Asset[] = [
    {
        id: '1',
        global_id: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0abcdef1234567890',
        name: 'prod-api-server-01',
        source_type: SourceType.AWS,
        asset_category: AssetCategory.COMPUTE,
        region: 'us-east-1',
        tags: { env: 'prod', owner: 'platform-team' },
        security_posture: {
            risk_score: 85,
            vulnerabilities: ['CVE-2023-44487'],
            misconfigurations: ['Public IP Assigned', 'Port 22 Open (0.0.0.0/0)']
        },
        raw_metadata: { instanceType: 't3.medium', state: 'running' }
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
        raw_metadata: { sku: 'Standard_LRS', kind: 'StorageV2' }
    },
    {
        id: '3',
        global_id: 'gh-user-88229',
        name: 'dave.admin@company.com',
        source_type: SourceType.SAAS_GITHUB,
        asset_category: AssetCategory.IDENTITY,
        region: 'global',
        tags: { role: 'admin' },
        security_posture: {
            risk_score: 15,
            vulnerabilities: [],
            misconfigurations: []
        },
        raw_metadata: { mfa_enabled: true, admin: true }
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
        raw_metadata: { type: 'Licensed' }
    }
];

const AssetIcon = ({ type }: { type: AssetCategory }) => {
    switch (type) {
        case AssetCategory.COMPUTE: return <Cpu className="w-4 h-4 text-indigo-500" />;
        case AssetCategory.STORAGE: return <Database className="w-4 h-4 text-amber-500" />;
        case AssetCategory.IDENTITY: return <User className="w-4 h-4 text-pink-500" />;
        default: return <Globe className="w-4 h-4 text-slate-500" />;
    }
};

const Inventory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const filteredAssets = MOCK_ASSETS.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.source_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAnalyze = async (asset: Asset) => {
        setSelectedAsset(asset);
        setAiAnalysis('');
        setIsAnalyzing(true);
        const result = await analyzeAssetRisk(asset);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Asset Inventory</h2>
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
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table List */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
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
                                        <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg">
                                                        <AssetIcon type={asset.asset_category} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{asset.name}</p>
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
                                                    onClick={() => handleAnalyze(asset)}
                                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs"
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
                    </Card>
                </div>

                {/* AI Analysis Panel */}
                <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col p-6 relative bg-slate-50/50">
                        {!selectedAsset ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
                                <p className="font-medium">Select an asset to analyze</p>
                                <p className="text-sm">Get Gemini-powered insights on vulnerabilities and risks.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full animate-fadeIn">
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                                    <div>
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                            AI Security Analyst
                                        </h3>
                                        <p className="text-xs text-slate-500">Analyzing {selectedAsset.name}</p>
                                    </div>
                                    <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600">×</button>
                                </div>
                                
                                {isAnalyzing ? (
                                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <p className="text-sm text-slate-500 animate-pulse">Consulting Gemini knowledge base...</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto prose prose-sm prose-slate max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>').replace(/### (.*)/g, '<h3 class="font-bold text-slate-800 mt-2">$1</h3>').replace(/- (.*)/g, '<li class="ml-4 list-disc">$1</li>') }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
