'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function JoinTripPage() {
    const params = useParams();
    const router = useRouter();
    const { user, login } = useAuth(); // Assuming login exposes a way to trigger auth or we check user
    const { toast } = useToast();
    const code = params?.code as string;

    const [loading, setLoading] = useState(false);
    const [tripDetails, setTripDetails] = useState<any>(null); // We might want to fetch details first

    const handleJoin = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please login to join the trip.",
                variant: "destructive"
            });
            // Redirect to login or show login modal
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/trips/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    userId: user.id,
                    name: user.name
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to join trip');
            }

            toast({
                title: "Success!",
                description: "You have joined the trip.",
            });

            router.push(`/trips/${result.tripId}`);

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Join Trip</CardTitle>
                    <CardDescription>
                        You've been invited to join a trip!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Join Code</p>
                        <p className="text-2xl font-mono font-bold tracking-wider">{code}</p>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleJoin}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            'Join Trip'
                        )}
                    </Button>

                    {!user && (
                        <p className="text-xs text-center text-muted-foreground">
                            You will be asked to login or sign up.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
