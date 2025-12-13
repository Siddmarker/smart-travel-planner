
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CandidateCard } from './CandidateCard';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface ClusterViewProps {
    day: any; // IDay
    refreshDay: () => void;
}

export function ClusterView({ day, refreshDay }: ClusterViewProps) {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('morning');

    const handleVote = async (dayId: string, period: string, candidateId: string) => {
        try {
            const action = isVoted(period, candidateId) ? 'unvote' : 'vote';

            const res = await fetch(`/api/days/${dayId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period, candidateId, action })
            });

            if (!res.ok) throw new Error('Vote failed');

            refreshDay(); // Optimistically update or re-fetch
            toast({ title: action === 'vote' ? "Vote recorded!" : "Vote removed" });

        } catch (error) {
            toast({ title: "Error", description: "Could not submit vote", variant: "destructive" });
        }
    };

    const isVoted = (period: string, candidateId: string) => {
        if (!session?.user?.id) return false;
        // Access votingPool instead of clusters
        const candidates = day.votingPool?.[period] || day.clusters?.[period]?.candidates || [];
        const candidate = candidates.find((c: any) => c.id === candidateId);
        // Check votes array of objects
        return candidate?.votes?.some((v: any) => v.userId === session.user.id);
    };

    const renderCluster = (period: string) => {
        // Access votingPool
        const candidates = day.votingPool?.[period] || day.clusters?.[period]?.candidates || [];
        if (candidates.length === 0) {
            return <div className="p-8 text-center text-gray-500">No options generated for {period}.</div>;
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((place: any) => (
                    <CandidateCard
                        key={place.id}
                        place={place}
                        period={period as any}
                        dayId={day.id}
                        onVote={handleVote}
                        isVoted={isVoted(period, place.id)}
                    />
                ))}
            </div>
        );
    };

    if (day.status !== 'VOTING' && day.status !== 'LOCKED') {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl text-gray-600">This day is not active for voting yet.</h2>
                {day.status === 'PENDING' && <p className="text-sm text-gray-400 mt-2">Waiting for previous days effectively.</p>}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Vibe Check & Vote - Day {day.dayIndex}</h2>
                {day.status === 'LOCKED' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">LOCKED</span>}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="morning">Morning</TabsTrigger>
                    <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                    <TabsTrigger value="evening">Evening</TabsTrigger>
                </TabsList>

                <TabsContent value="morning" className="mt-4">
                    {renderCluster('morning')}
                </TabsContent>
                <TabsContent value="afternoon" className="mt-4">
                    {renderCluster('afternoon')}
                </TabsContent>
                <TabsContent value="evening" className="mt-4">
                    {renderCluster('evening')}
                </TabsContent>
            </Tabs>
        </div>
    );
}
