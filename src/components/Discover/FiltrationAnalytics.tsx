import React from 'react';
import { ShieldCheck, Filter, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FiltrationAnalyticsProps {
    originalCount: number;
    filteredCount: number;
    filtrationRate: number;
    isVisible: boolean;
}

export function FiltrationAnalytics({
    originalCount,
    filteredCount,
    filtrationRate,
    isVisible
}: FiltrationAnalyticsProps) {
    if (!isVisible || originalCount === 0) return null;

    const filteredOut = originalCount - filteredCount;

    return (
        <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">

                {/* Header Section */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            Discovery Quality Filter
                            <span className="text-xs px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                                Active
                            </span>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Showing only verified, high-quality places
                        </p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <p className="text-lg font-bold text-muted-foreground">{originalCount}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Found</p>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{filteredCount}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Verified</p>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="text-center">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex flex-col items-center cursor-help">
                                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{filteredOut}</p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                            Filtered <Info className="h-3 w-3" />
                                        </p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Low quality, fake, or irrelevant entities removed</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
