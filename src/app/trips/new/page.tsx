'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trip } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function NewTripPage() {
    const router = useRouter();
    const addTrip = useStore((state) => state.addTrip);
    const currentUser = useStore((state) => state.currentUser);

    const [formData, setFormData] = useState({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const newTrip: Trip = {
            id: uuidv4(),
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate,
            destination: {
                name: formData.destination,
                lat: 51.505, // Mock coordinates
                lng: -0.09,
            },
            participants: [currentUser],
            days: [],
            budget: {
                currency: 'USD',
                total: 0,
                spent: 0,
            },
        };

        addTrip(newTrip);
        router.push(`/trips/${newTrip.id}`);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Plan a New Trip</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Trip Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Summer in Paris"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destination">Destination</Label>
                            <Input
                                id="destination"
                                placeholder="Where are you going?"
                                required
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            Create Trip
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
