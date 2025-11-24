
import React, { useState } from 'react';
import { Card, Badge } from '../components/Widgets';
import { Connector, SourceType, AuthMethod } from '../types';
import { generateConnectorYaml } from '../services/geminiService';
import { Cloud, Plus, Command, RefreshCw, Key, Code, Lock, ExternalLink, Shield, CheckCircle, Copy } from 'lucide-react';

const MOCK_CONNECTORS: Connector[] = [
    { id: '1', name: 'Production AWS', provider: SourceType.AWS, status: 'ACTIVE', last_sync: '10 mins ago', auth_method: AuthMethod.IAM_ROLE },
    { id: '2', name: 'Corp Azure', provider: SourceType.AZURE, status: 'ACTIVE', last_sync: '15 mins ago', auth_method: AuthMethod.OAUTH },
    { id: '3', name: 'Engineering Github', provider: SourceType.SAAS_GITHUB, status: 'SYNCING', last_sync: 'Now', auth_method: AuthMethod.OAUTH },
];

const Connectors: React.FC = () => {
    const [connectors, setConnectors] = useState(MOCK_CONNECTORS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<SourceType | null>(null);
    
    // AWS State
    const [awsRoleArn, setAwsRoleArn] = useState('');
    const externalId = 'sentinel-uuid-v4-5566-7788'; // Mock generated ID

    // Azure State
    const [tenantId, setTenantId] = useState('');

    // Generic SaaS Generator State
    const [saasDescription, setSaasDescription] = useState('');
    const [generatedYaml, setGeneratedYaml] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateYaml = async () => {
        if (!saasDescription) return;
        setIsGenerating(true);
        const yaml = await generateConnectorYaml(saasDescription);
        setGeneratedYaml(yaml);
        setIsGenerating(false);
    };

    const handleProviderSelect = (type: SourceType) => {
        setSelectedProvider(type);
    };

    const resetModal = () => {
        setIsModalOpen(false);
        setSelectedProvider(null);
        setGeneratedYaml('');
        setSaasDescription('');
        setAwsRoleArn('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Integrations</h2>
                    <p className="text-slate-500">Manage Cloud Providers and SaaS Connectors</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Integration
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map(connector => (
                    <Card key={connector.id} className="p-6 border-t-4 border-t-indigo-500 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <Cloud className="w-6 h-6 text-slate-700" />
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge variant={connector.status === 'ACTIVE' ? 'success' : connector.status === 'SYNCING' ? 'warning' : 'error'}>
                                    {connector.status}
                                </Badge>
                                <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> {connector.last_sync}
                                </span>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{connector.name}</h3>
                        <p className="text-sm text-slate-500 mb-2">{connector.provider}</p>
                        
                        <div className="mb-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
                                {connector.auth_method === AuthMethod.IAM_ROLE && <Shield className="w-3 h-3" />}
                                {connector.auth_method === AuthMethod.OAUTH && <Key className="w-3 h-3" />}
                                {connector.auth_method === AuthMethod.STATIC_KEY && <Lock className="w-3 h-3" />}
                                {connector.auth_method?.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                             <button className="text-sm font-medium text-slate-600 hover:text-indigo-600">Configure</button>
                             <button className="text-sm font-medium text-rose-600 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">Disconnect</button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Integration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">
                                {selectedProvider ? `Configure ${selectedProvider}` : 'Select Provider'}
                            </h3>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {!selectedProvider ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={() => handleProviderSelect(SourceType.AWS)} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group">
                                        <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md">
                                            <Cloud className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Amazon Web Services</h4>
                                            <p className="text-xs text-slate-500">Connect via Cross-Account IAM Role</p>
                                        </div>
                                    </button>
                                    
                                    <button onClick={() => handleProviderSelect(SourceType.AZURE)} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group">
                                        <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md">
                                            <Cloud className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Microsoft Azure</h4>
                                            <p className="text-xs text-slate-500">Connect via Entra ID OAuth</p>
                                        </div>
                                    </button>

                                    <button onClick={() => handleProviderSelect(SourceType.SAAS_GENERIC)} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group md:col-span-2">
                                        <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md">
                                            <Code className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Generic SaaS Adapter (AI)</h4>
                                            <p className="text-xs text-slate-500">Generate connectors for any SaaS using Gemini</p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* AWS CONFIGURATION */}
                                    {selectedProvider === SourceType.AWS && (
                                        <div className="space-y-6">
                                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-start gap-3">
                                                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-amber-900">Secure Access Pattern</h4>
                                                    <p className="text-xs text-amber-800 mt-1">
                                                        We use a Cross-Account IAM Role. No permanent access keys are stored. 
                                                        Sentinel assumes this role only during scan windows.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Step 1: External ID</label>
                                                    <div className="flex gap-2">
                                                        <code className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 select-all">
                                                            {externalId}
                                                        </code>
                                                        <button className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-200">
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">Use this External ID in your Trust Policy to prevent The Confused Deputy problem.</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Step 2: Create Stack</label>
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">
                                                        <ExternalLink className="w-4 h-4" />
                                                        Launch CloudFormation Stack
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Step 3: Role ARN</label>
                                                    <input 
                                                        type="text" 
                                                        value={awsRoleArn}
                                                        onChange={(e) => setAwsRoleArn(e.target.value)}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                                                        placeholder="arn:aws:iam::123456789012:role/SentinelAccessRole" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* AZURE CONFIGURATION */}
                                    {selectedProvider === SourceType.AZURE && (
                                        <div className="space-y-6">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                                                <Key className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-blue-900">OAuth 2.0 Authorization</h4>
                                                    <p className="text-xs text-blue-800 mt-1">
                                                        We will redirect you to Microsoft to authorize read-only access.
                                                        We request <code>offline_access</code> to securely store a Refresh Token in Vault for scheduled scans.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tenant ID</label>
                                                    <input 
                                                        type="text" 
                                                        value={tenantId}
                                                        onChange={(e) => setTenantId(e.target.value)}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                                                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">The Directory ID of your Azure Active Directory.</p>
                                                </div>

                                                <div className="pt-4">
                                                    <button className="w-full py-3 bg-[#0078d4] hover:bg-[#006abc] text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm">
                                                        <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 0L0 0V10.5H10.5V0Z" fill="#F25022"/><path d="M21 0L10.5 0V10.5H21V0Z" fill="#7FBA00"/><path d="M10.5 10.5L0 10.5V21H10.5V10.5Z" fill="#00A4EF"/><path d="M21 10.5L10.5 10.5V21H21V10.5Z" fill="#FFB900"/></svg>
                                                        Connect with Microsoft
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* GENERIC SAAS CONFIGURATION */}
                                    {selectedProvider === SourceType.SAAS_GENERIC && (
                                        <div className="space-y-4">
                                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                                    <Command className="w-4 h-4" />
                                                    AI Configuration Generator
                                                </h4>
                                                <p className="text-xs text-indigo-700 mt-1">
                                                    Describe the SaaS provider (e.g., Zoom, Slack, Salesforce). Gemini will generate a connector definition using OAuth 2.0 best practices.
                                                </p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Describe Integration</label>
                                                <textarea 
                                                    value={saasDescription}
                                                    onChange={(e) => setSaasDescription(e.target.value)}
                                                    rows={3} 
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                                    placeholder="Example: Connect to Zoom using OAuth2. I need to fetch users from /v2/users and settings from /v2/accounts/me/settings..."
                                                ></textarea>
                                            </div>

                                            <button 
                                                onClick={handleGenerateYaml}
                                                disabled={isGenerating || !saasDescription}
                                                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                                            >
                                                {isGenerating ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <Code className="w-4 h-4" />}
                                                Generate Connector Definition
                                            </button>

                                            {generatedYaml && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Generated YAML</label>
                                                    <div className="relative">
                                                        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs overflow-auto max-h-48 font-mono border border-slate-700 shadow-inner">
                                                            {generatedYaml}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {selectedProvider && (
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                                <button onClick={() => setSelectedProvider(null)} className="text-sm font-medium text-slate-500 hover:text-slate-800">
                                    &larr; Back to selection
                                </button>
                                <div className="flex gap-3">
                                    <button onClick={resetModal} className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-slate-900">Cancel</button>
                                    <button onClick={resetModal} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                                        {selectedProvider === SourceType.AWS ? 'Verify & Save' : selectedProvider === SourceType.AZURE ? 'Initiate OAuth' : 'Save Definition'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Connectors;
