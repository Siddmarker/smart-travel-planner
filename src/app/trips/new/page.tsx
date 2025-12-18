
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createBrowserClient } from '@supabase/ssr';
import { DestinationSearch } from '@/components/CreateTrip/DestinationSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

export default function NewTripPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { currentUser, isAuthenticated } = useStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        destination: null as any, // Holds full place object
        startDate: '',
        endDate: '',
        budget: 1000,
        tripType: 'Friends'
    });

    // Protect route
    useEffect(() => {
        if (!isAuthenticated) {
            toast({ title: "Authentication Required", description: "Please log in to create a trip.", variant: "destructive" });
            router.push('/login');
        }
    }, [isAuthenticated, router, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Starting trip creation...");
        setLoading(true);

        // Validation
        if (!formData.destination || !formData.destination.location) {
            toast({ title: "Validation Error", description: "Please select a valid destination from the list.", variant: "destructive" });
            setLoading(false);
            return;
        }

        try {
            // 1. Get the Session Manually
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { session } } = await supabase.auth.getSession();

            // Debugging: Check if we actually have a token
            if (!session || !session.access_token) {
                console.error("NO SESSION FOUND. Aborting.");
                toast({ title: "Authentication Error", description: "You appear to be logged out. Please refresh and log in.", variant: "destructive" });
                router.push('/login');
                return;
            }

            console.log("Session found. Token:", session.access_token.substring(0, 10) + "...");

            // Simple budget mapping
            const budgetNum = Number(formData.budget);
            let budgetTier = 'Medium';
            if (budgetNum < 1000) budgetTier = 'Low';
            if (budgetNum > 3000) budgetTier = 'High';

            const payload = {
                // userId: currentUser.id, // Not used by backend currently (uses session or ignores)
                name: formData.name,
                destination: formData.destination.name, // Send string name only
                startDate: formData.startDate,          // Send top-level
                endDate: formData.endDate,              // Send top-level
                budget: budgetTier,                     // Send Text Tier
                tripType: formData.tripType,
                categories: []                          // Send empty array or add UI later
            };

            // 2. Send the Request with the Header
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` // <--- THE FIX
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                console.error("API Error:", err);
                throw new Error(err.error || 'Failed to create trip');
            }

            const data = await res.json();
            console.log("Success:", data);
            toast({ title: "Trip created!", description: "Redirecting to dashboard..." });
            window.location.href = `/trips/${data.trip._id}`;

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-lg mt-10">
            <Card>
                <CardHeader>
                    <CardTitle>Plan a New Trip</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Trip Name</Label>
                            <Input
                                id="name" name="name"
                                placeholder="e.g. Summer in Tokyo"
                                value={formData.name} onChange={handleChange} required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destination">Destination</Label>
                            <DestinationSearch
                                onSelect={(place) => {
                                    setFormData(prev => ({ ...prev, destination: place }));
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate" name="startDate" type="date"
                                    value={formData.startDate} onChange={handleChange} required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate" name="endDate" type="date"
                                    value={formData.endDate} onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Who is traveling?</Label>
                            <Select
                                value={formData.tripType}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, tripType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Trip Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Solo">Solo</SelectItem>
                                    <SelectItem value="Couple">Couple</SelectItem>
                                    <SelectItem value="Friends">Friends</SelectItem>
                                    <SelectItem value="Family">Family</SelectItem>
                                    <SelectItem value="Corporate">Corporate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget ($)</Label>
                            <Input
                                id="budget" name="budget" type="number"
                                value={formData.budget} onChange={handleChange}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Trip'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
