
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';


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
    const { user } = useAuth(); // <--- Get the logged-in user directly
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
        // user might be null initially while loading, but AuthContext handles initial check.
        // If we strictly want to redirect:
        if (!user && !localStorage.getItem('user-storage')) { // Simple check or rely on AuthContext loading state if exposed
            // For now, let's assume if user is missing and we interact, we alert. 
            // Or we can add a loading check if AuthContext exposes it.
        }
    }, [user, router]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to create a trip.", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            // Simple budget mapping
            const budgetNum = Number(formData.budget);
            let budgetTier = 'Medium';
            if (budgetNum < 1000) budgetTier = 'Low';
            if (budgetNum > 3000) budgetTier = 'High';

            const payload = {
                name: formData.name,
                destination: formData.destination?.name || '',
                startDate: formData.startDate,
                endDate: formData.endDate,
                budget: budgetTier,
                travelerType: formData.tripType,
                userId: user.id // <--- VITAL: Send the ID to the backend
            };

            const response = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create trip');
            }

            console.log("Success:", data);
            toast({ title: "Trip created!", description: "Redirecting to dashboard..." });

            // Redirect
            if (data.id) {
                window.location.href = `/trips/${data.id}`;
            } else if (data._id) {
                window.location.href = `/trips/${data._id}`;
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
