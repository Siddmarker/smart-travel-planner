
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { DestinationSearch } from '@/components/CreateTrip/DestinationSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        budget: 1000
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
        setLoading(true);

        // Validation
        if (!formData.destination || !formData.destination.location) {
            toast({ title: "Validation Error", description: "Please select a valid destination from the list.", variant: "destructive" });
            setLoading(false);
            return;
        }

        if (!currentUser) {
            toast({ title: "Error", description: "User not identified", variant: "destructive" });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                userId: currentUser.id, // Explicitly send user ID for non-session auth
                name: formData.name,
                destination: {
                    name: formData.destination.name,
                    location: formData.destination.location,
                    placeId: formData.destination.placeId
                },
                dates: { start: formData.startDate, end: formData.endDate },
                settings: { budget: Number(formData.budget) },
                // Defaults required by schema
                pax: 1,
                tripType: 'friends'
            };

            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                toast({ title: "Trip created!", description: "Redirecting to dashboard..." });
                router.push(`/trips/${data.trip._id}`);
            } else {
                const error = await res.json();
                console.error("Create Trip Error:", error);
                toast({ title: "Failed to create trip", description: error.details || error.error || "Unknown error", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
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
