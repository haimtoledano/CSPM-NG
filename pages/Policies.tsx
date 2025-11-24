import React, { useState } from 'react';
import { Card, Badge } from '../components/Widgets';
import { ComplianceStandard, Policy, SourceType } from '../types';
import { generatePolicyLogic } from '../services/geminiService';
import { ShieldCheck, FileText, CheckCircle, AlertTriangle, Play, Sparkles, Terminal } from 'lucide-react';

const MOCK_STANDARDS: ComplianceStandard[] = [
    { id: '1', name: 'CIS AWS Foundations v1.4', description: 'Industry standard for secure AWS configuration', score: 82, passing_controls: 41, total_controls: 50 },
    { id: '2', name: 'NIST 800-53 Rev 5', description: 'Security and Privacy Controls for Info Systems', score: 65, passing_controls: 130, total_controls: 200 },
    { id: '3', name: 'SOC 2 Type II', description: 'Trust Services Criteria for Security', score: 94, passing_controls: 47, total_controls: 50 },
];

const MOCK_POLICIES: Policy[] = [
    { id: 'p1', name: 'Ensure S3 Buckets are not public', severity: 'CRITICAL', provider: SourceType.AWS, status: 'ACTIVE', description: 'S3 buckets should have public access blocks enabled.' },
    { id: 'p2', name: 'Ensure MFA enabled for Root Account', severity: 'CRITICAL', provider: SourceType.AWS, status: 'ACTIVE', description: 'Root account must have hardware MFA.' },
    { id: 'p3', name: 'Ensure Storage Accounts use HTTPS', severity: 'MEDIUM', provider: SourceType.AZURE, status: 'DISABLED', description: 'Secure transfer required must be set to true.' },
    { id: 'p4', name: 'GitHub Repos should be private', severity: 'HIGH', provider: SourceType.SAAS_GITHUB, status: 'ACTIVE', description: 'Default repository visibility should be private.' },
];

const Policies: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'standards' | 'rules'>('standards');
    const [policyPrompt, setPolicyPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>('AWS');

    const handleGenerate = async () => {
        if (!policyPrompt) return;
        setIsGenerating(true);
        const code = await generatePolicyLogic(policyPrompt, selectedProvider);
        setGeneratedCode(code);
        setIsGenerating(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Compliance & Policies</h2>
                    <p className="text-slate-500">Manage frameworks, benchmarks, and custom security rules.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('standards')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'standards' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Compliance Frameworks
                </button>
                <button 
                    onClick={() => setActiveTab('rules')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Policy Rules
                </button>
            </div>

            {activeTab === 'standards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_STANDARDS.map(std => (
                        <Card key={std.id} className="p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg">
                                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold ${std.score >= 80 ? 'text-emerald-600' : std.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                        {std.score}%
                                    </span>
                                    <p className="text-xs text-slate-400">Compliance Score</p>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">{std.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 h-10">{std.description}</p>
                            
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${std.score}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{std.passing_controls} Passing</span>
                                <span>{std.total_controls - std.passing_controls} Failing</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Rules List */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="overflow-hidden">
                             <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-medium text-slate-500">Policy Name</th>
                                        <th className="px-6 py-4 font-medium text-slate-500">Severity</th>
                                        <th className="px-6 py-4 font-medium text-slate-500">Provider</th>
                                        <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {MOCK_POLICIES.map((policy) => (
                                        <tr key={policy.id} className="hover:bg-slate-50 group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{policy.name}</p>
                                                    <p className="text-xs text-slate-500 truncate max-w-xs">{policy.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={policy.severity === 'CRITICAL' ? 'error' : policy.severity === 'HIGH' ? 'warning' : 'neutral'}>
                                                    {policy.severity}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-600 font-medium text-xs bg-slate-100 px-2 py-1 rounded">{policy.provider}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${policy.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                    <span className="text-xs text-slate-500">{policy.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    {/* AI Policy Generator */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 bg-slate-900 text-white h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-24 h-24" />
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    AI Policy Generator
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">Describe a security requirement, and Gemini will generate the policy logic (Rego/Python).</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Provider</label>
                                        <select 
                                            value={selectedProvider}
                                            onChange={(e) => setSelectedProvider(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="AWS">AWS</option>
                                            <option value="Azure">Azure</option>
                                            <option value="Kubernetes">Kubernetes</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Requirement Description</label>
                                        <textarea 
                                            value={policyPrompt}
                                            onChange={(e) => setPolicyPrompt(e.target.value)}
                                            rows={3}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g., Ensure that no Security Group allows ingress on port 22 from 0.0.0.0/0"
                                        ></textarea>
                                    </div>

                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !policyPrompt}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Play className="w-4 h-4" />}
                                        Generate Policy Code
                                    </button>

                                    {generatedCode && (
                                        <div className="mt-4 animate-fadeIn">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-emerald-400 font-mono">Generated Logic</span>
                                                <Terminal className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <pre className="bg-black/50 p-3 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-700">
                                                {generatedCode}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Policies;