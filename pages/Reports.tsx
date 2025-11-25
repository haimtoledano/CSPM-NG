import React, { useState } from 'react';
import { Card, Badge } from '../components/Widgets';
import { ReportTemplate, ReportContext } from '../types';
import { generateReportSummary } from '../services/geminiService';
import { FileText, Download, Printer, ArrowLeft, Calendar, Shield, AlertTriangle, PieChart as PieChartIcon, CheckCircle, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const MOCK_TEMPLATES: ReportTemplate[] = [
    { id: '1', name: 'Executive Security Summary', description: 'High-level overview of security posture, trends, and top risks for C-Level executives.', type: 'EXECUTIVE' },
    { id: '2', name: 'CIS Compliance Audit', description: 'Detailed breakdown of pass/fail controls against CIS Benchmark v1.4.', type: 'COMPLIANCE' },
    { id: '3', name: 'Vulnerability Assessment', description: 'List of all active CVEs, affected assets, and remediation status.', type: 'VULNERABILITY' },
];

const MOCK_CONTEXT: ReportContext = {
    generatedDate: new Date().toLocaleDateString(),
    tenantName: 'Acme Corp',
    totalAssets: 1432,
    riskScore: 82, // High score is better in this context or inverse? Let's assume 100 is secure.
    criticalIssues: 12,
    complianceScore: 87.5,
    topRisks: ['S3 Bucket Public Access', 'Root Account MFA Missing', 'Outdated OS Images']
};

const Reports: React.FC = () => {
    const [view, setView] = useState<'GALLERY' | 'PREVIEW'>('GALLERY');
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [executiveSummary, setExecutiveSummary] = useState('');

    const handleSelectTemplate = async (template: ReportTemplate) => {
        setSelectedTemplate(template);
        setIsGenerating(true);
        setView('PREVIEW');
        
        // Generate AI Summary
        const summary = await generateReportSummary(template.name, MOCK_CONTEXT);
        setExecutiveSummary(summary);
        setIsGenerating(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        setView('GALLERY');
        setExecutiveSummary('');
    };

    if (view === 'GALLERY') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
                        <p className="text-slate-500">Generate audit-ready reports with AI insights.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_TEMPLATES.map(template => (
                        <Card key={template.id} className="p-6 hover:shadow-lg transition-all border-t-4 border-t-indigo-500 flex flex-col cursor-pointer group" >
                            <div className="mb-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <FileText className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">{template.name}</h3>
                            <p className="text-sm text-slate-500 flex-1">{template.description}</p>
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => handleSelectTemplate(template)}
                                    className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // --- PREVIEW VIEW ---
    return (
        <div className="space-y-6">
            {/* Toolbar - Hidden when Printing */}
            <div className="flex justify-between items-center print:hidden">
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Templates
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={handlePrint}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm"
                    >
                        {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Printer className="w-4 h-4" />}
                        Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* A4 Report Container */}
            <div className="bg-white shadow-2xl mx-auto max-w-[210mm] min-h-[297mm] p-[15mm] print:shadow-none print:m-0 print:p-0 print:w-full">
                
                {/* Report Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Security Report</h1>
                        <p className="text-lg text-indigo-600 font-medium mt-1">{selectedTemplate?.name}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end text-slate-500 font-medium">
                            <Shield className="w-5 h-5" />
                            <span>CSPM-NG Platform</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{MOCK_CONTEXT.generatedDate}</p>
                    </div>
                </div>

                {/* Executive Summary Section */}
                <div className="mb-10">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-indigo-600 pl-3 uppercase">Executive Summary</h2>
                    <div className="bg-slate-50 p-6 rounded-xl text-sm leading-relaxed text-slate-700 text-justify">
                        {isGenerating ? (
                            <div className="flex items-center gap-3 text-indigo-600 animate-pulse">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-medium">Generating AI insights based on system telemetry...</span>
                            </div>
                        ) : (
                            <div className="whitespace-pre-line">
                                {executiveSummary}
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="mb-10">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 border-l-4 border-indigo-600 pl-3 uppercase">Key Metrics</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="text-center p-4 border rounded-lg bg-white">
                            <p className="text-xs font-bold text-slate-400 uppercase">Compliance</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">{MOCK_CONTEXT.complianceScore}%</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg bg-white">
                            <p className="text-xs font-bold text-slate-400 uppercase">Risk Score</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-2">{MOCK_CONTEXT.riskScore}</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg bg-white">
                            <p className="text-xs font-bold text-slate-400 uppercase">Total Assets</p>
                            <p className="text-3xl font-bold text-slate-700 mt-2">{MOCK_CONTEXT.totalAssets}</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg bg-white">
                            <p className="text-xs font-bold text-slate-400 uppercase">Critical Risks</p>
                            <p className="text-3xl font-bold text-rose-600 mt-2">{MOCK_CONTEXT.criticalIssues}</p>
                        </div>
                    </div>
                </div>

                {/* Visualizations Row */}
                <div className="grid grid-cols-2 gap-8 mb-10 print:break-inside-avoid">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-slate-400" />
                            Compliance Distribution
                        </h3>
                        <div className="h-64 w-full border border-slate-100 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Pass', value: 85 },
                                            { name: 'Fail', value: 15 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-[-20px] text-xs">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Pass (85%)</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Fail (15%)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-slate-400" />
                            Assets by Severity
                        </h3>
                         <div className="h-64 w-full border border-slate-100 rounded-lg p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Critical', value: 12 },
                                    { name: 'High', value: 45 },
                                    { name: 'Medium', value: 120 },
                                    { name: 'Low', value: 300 },
                                ]}>
                                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                                    <YAxis fontSize={10} stroke="#94a3b8" />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Risks Table */}
                <div className="print:break-inside-avoid">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-indigo-600 pl-3 uppercase">Critical Findings</h2>
                    <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-slate-500 font-medium">
                            <tr>
                                <th className="p-3">Risk Title</th>
                                <th className="p-3">Severity</th>
                                <th className="p-3">Affected Assets</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_CONTEXT.topRisks.map((risk, i) => (
                                <tr key={i}>
                                    <td className="p-3 font-medium text-slate-900">{risk}</td>
                                    <td className="p-3"><Badge variant="error">Critical</Badge></td>
                                    <td className="p-3 text-slate-500">3 Assets</td>
                                    <td className="p-3"><Badge variant="warning">Open</Badge></td>
                                </tr>
                            ))}
                            <tr>
                                <td className="p-3 font-medium text-slate-900">Unencrypted EBS Volumes</td>
                                <td className="p-3"><Badge variant="warning">High</Badge></td>
                                <td className="p-3 text-slate-500">14 Assets</td>
                                <td className="p-3"><Badge variant="warning">Open</Badge></td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-900">MFA Not Enabled on User</td>
                                <td className="p-3"><Badge variant="warning">High</Badge></td>
                                <td className="p-3 text-slate-500">5 Users</td>
                                <td className="p-3"><Badge variant="success">Fixed</Badge></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                {/* Footer for Print */}
                <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 print:fixed print:bottom-4 print:w-full">
                    Generated by CSPM-NG • {new Date().getFullYear()} • Confidential Document
                </div>
            </div>
        </div>
    );
};

export default Reports;