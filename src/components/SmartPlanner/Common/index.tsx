import React from 'react';

interface ScoreBadgeProps {
    score: number;
    label?: string;
    showPercentage?: boolean;
    small?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, label, showPercentage, small }) => {
    const getColor = (s: number) => {
        if (s >= 80) return 'bg-green-500';
        if (s >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className={`flex items-center gap-2 ${small ? 'text-xs' : 'text-sm'}`}>
            <div className={`rounded-full px-2 py-1 text-white font-bold ${getColor(score)}`}>
                {score}{showPercentage ? '%' : ''}
            </div>
            {label && <span className="text-gray-600 font-medium">{label}</span>}
        </div>
    );
};

export const LoadingSpinner: React.FC<{ size?: 'small' | 'large' }> = ({ size = 'large' }) => (
    <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${size === 'small' ? 'h-6 w-6' : 'h-12 w-12'}`} />
);

export const Chip: React.FC<{ label: string; color?: string }> = ({ label, color = 'blue' }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        {label}
    </span>
);
