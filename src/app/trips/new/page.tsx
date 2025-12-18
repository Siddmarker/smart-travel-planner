
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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
        console.log("🚀 Starting Universal Trip Creation...");
        setLoading(true);

        let accessToken = null;
        let userId = null;

        // --- STRATEGY 1: Standard SDK Check ---
        try {
            const supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log("✅ Strategy 1 (SDK) Worked");
                accessToken = session.access_token;
                userId = session.user.id;
            }
        } catch (err) { console.log("Strategy 1 failed"); }

        // --- STRATEGY 2: LocalStorage Scavenger Hunt (The Backup) ---
        if (!accessToken) {
            console.log("⚠️ SDK failed. Hunting in LocalStorage...");
            // Loop through all keys to find the Supabase token
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key)!);
                        if (item.access_token) {
                            console.log("✅ Strategy 2 (LocalStorage) Found it!");
                            accessToken = item.access_token;
                            userId = item.user.id;
                            break;
                        }
                    } catch (e) { /* Ignore parse errors */ }
                }
            }
        }

        // --- FINAL CHECK ---
        if (!accessToken) {
            console.error("❌ CRITICAL: No token found in SDK or LocalStorage.");
            toast({ title: "System Error", description: "You appear logged in, but your session token is missing. Please Logout and Login again.", variant: "destructive" });
            setLoading(false);
            return;
        }

        // Validation
        if (!formData.destination || !formData.destination.location) {
            toast({ title: "Validation Error", description: "Please select a valid destination from the list.", variant: "destructive" });
            setLoading(false);
            return;
        }

        try {
            // Simple budget mapping
            const budgetNum = Number(formData.budget);
            let budgetTier = 'Medium';
            if (budgetNum < 1000) budgetTier = 'Low';
            if (budgetNum > 3000) budgetTier = 'High';

            const payload = {
                name: formData.name,
                destination: formData.destination.name,
                startDate: formData.startDate,
                endDate: formData.endDate,
                budget: budgetTier,
                tripType: formData.tripType,
                categories: []
            };

            // --- EXECUTE REQUEST ---
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}` // <--- Manually attach the found token
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create trip');
            }

            const data = await res.json();
            console.log("🎉 SUCCESS:", data);
            toast({ title: "Trip created!", description: "Redirecting to dashboard..." });

            // Redirect to the specific trip
            if (data.trip && data.trip._id) {
                window.location.href = `/trips/${data.trip._id}`;
            } else {
                window.location.href = '/my-trips';
            }

        } catch (error: any) {
            console.error("Submission Error:", error);
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
