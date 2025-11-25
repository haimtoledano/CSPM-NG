
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, ArrowRight, CheckCircle, Loader2, Lock, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

const Login: React.FC = () => {
    const { login, isAuthenticated, checkEmailStatus, generateTempSecret, completeMfaSetup } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'EMAIL' | 'SETUP' | 'VERIFY'>('EMAIL');
    const [qrUrl, setQrUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setError('Please enter a valid email.');
            return;
        }

        const check = checkEmailStatus(email);

        if (check.status === 'UNKNOWN') {
            setError('Access Denied. This user does not exist in the system. Please contact an Administrator.');
            return;
        }

        if (check.status === 'SYSTEM_INIT' || check.status === 'KNOWN_NO_MFA') {
            // Allow Setup logic
            // 1. Init Mode: First user becomes Admin
            // 2. Known No MFA: Admin created user, user setting up MFA for first time
            const newSecret = generateTempSecret();
            setSecret(newSecret);
            const otpUri = `otpauth://totp/CSPM-NG:${email}?secret=${newSecret}&issuer=CSPM-NG`;
            
            QRCode.toDataURL(otpUri, (err, url) => {
                if (err) console.error(err);
                setQrUrl(url);
                setStep('SETUP');
                setError('');
            });
        } else if (check.status === 'KNOWN_WITH_MFA') {
            setStep('VERIFY');
            setError('');
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(email, code);
        setLoading(false);
        
        if (success) {
            navigate('/');
        } else {
            setError('Invalid Authentication Code. Please try again.');
        }
    };

    const handleSetupVerify = (e: React.FormEvent) => {
        e.preventDefault();
        // This attempts to save the user (if new admin) or update the user (if existing)
        const success = completeMfaSetup(email, secret, code);
        
        if (success) {
            navigate('/');
        } else {
            setError('Invalid code. Ensure you scanned the QR correctly.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                         <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-white rounded-full mix-blend-overlay"></div>
                         <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-white rounded-full mix-blend-overlay"></div>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">CSPM-NG Platform</h1>
                    <p className="text-indigo-100 text-sm mt-2 font-medium">Unified Cloud Security</p>
                </div>

                <div className="p-8">
                    {step === 'EMAIL' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
                                <p className="text-sm text-slate-500">Sign in to access your dashboard.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="name@company.com"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-100">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-100">
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {step === 'SETUP' && (
                        <form onSubmit={handleSetupVerify} className="space-y-6 animate-fadeIn">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-900">Device Enrollment</h2>
                                <p className="text-sm text-slate-500 mb-4">Scan this QR code to secure your account.</p>
                                
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm inline-block mb-2">
                                    {qrUrl && <img src={qrUrl} alt="MFA QR Code" className="w-40 h-40 mix-blend-multiply" />}
                                </div>
                                
                                <p className="text-xs text-slate-400 font-mono break-all mb-4 px-4 bg-slate-50 py-2 rounded border border-slate-100">
                                    Secret: {secret}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Enter 6-digit Code</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-lg tracking-widest"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-rose-600 font-medium text-center bg-rose-50 p-2 rounded">{error}</p>
                            )}

                            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Verify & Complete Setup
                            </button>
                        </form>
                    )}

                    {step === 'VERIFY' && (
                        <form onSubmit={handleVerifySubmit} className="space-y-6 animate-fadeIn">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Two-Factor Auth</h2>
                                <p className="text-sm text-slate-500">Enter the code from your authenticator app.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Enter 6-digit Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-lg tracking-widest"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-rose-600 font-medium bg-rose-50 p-2 rounded text-center">{error}</p>}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-indigo-100"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Verify Login
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => setStep('EMAIL')}
                                className="w-full text-sm text-slate-500 hover:text-slate-700"
                            >
                                Back to Email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
