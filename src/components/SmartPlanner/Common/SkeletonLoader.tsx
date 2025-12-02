import React from 'react';

interface SkeletonLoaderProps {
    type: 'place' | 'day';
    count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 3 }) => {
    if (type === 'place') {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-white/10 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-white/10 rounded w-3/4" />
                                <div className="h-4 bg-white/10 rounded w-1/2" />
                                <div className="flex gap-2 mt-2">
                                    <div className="h-6 w-16 bg-white/10 rounded-full" />
                                    <div className="h-6 w-16 bg-white/10 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4">
                        <div className="h-6 bg-white/10 rounded w-1/4" />
                        <div className="space-y-3">
                            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
                            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
                            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
