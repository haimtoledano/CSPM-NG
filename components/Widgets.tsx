import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
        {children}
    </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'error' | 'neutral' }> = ({ children, variant = 'neutral' }) => {
    const variants = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        error: 'bg-rose-50 text-rose-700 border-rose-200',
        neutral: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
            {children}
        </span>
    );
};

export const RiskBadge: React.FC<{ score: number }> = ({ score }) => {
    let variant: 'success' | 'warning' | 'error' = 'success';
    if (score > 40) variant = 'warning';
    if (score > 75) variant = 'error';
    
    return (
        <Badge variant={variant}>
            Risk: {score}/100
        </Badge>
    );
};
