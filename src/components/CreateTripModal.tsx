'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { TripCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Type, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateTripModalProps {
    children?: React.ReactNode;
}

export function CreateTripModal({ children }: CreateTripModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [returnToStart, setReturnToStart] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('20:00');
    const [selectedCategories, setSelectedCategories] = useState<TripCategory[]>([]);

    const { addTrip, currentUser } = useStore();
    const router = useRouter();

    const TRIP_CATEGORIES: { value: TripCategory; label: string; icon: string }[] = [
        { value: 'trekking', label: 'Trekking/Hiking', icon: '🥾' },
        { value: 'food', label: 'Food & Dining', icon: '🍽️' },
        { value: 'scenic_drives', label: 'Scenic Drives', icon: '🚗' },
        { value: 'cultural', label: 'Cultural Sites', icon: '🏛️' },
        { value: 'beaches', label: 'Beaches', icon: '🏖️' },
        { value: 'adventure', label: 'Adventure Sports', icon: '🪂' },
        { value: 'shopping', label: 'Shopping', icon: '🛍️' },
        { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
        { value: 'historical', label: 'Historical', icon: '🏰' },
        { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
        { value: 'religious', label: 'Religious', icon: '🕌' },
        { value: 'markets', label: 'Local Markets', icon: '🏪' },
    ];

    const toggleCategory = (category: TripCategory) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        const newTrip = {
            id: uuidv4(),
            name,
            startDate,
            endDate,
            destination: {
                name: destination,
                lat: 0, // Mock lat/lng for now
                lng: 0,
            },
            participants: [currentUser],
            days: [],
            budget: {
                currency: 'USD',
                total: Number(budget) || 0,
                spent: 0,
            },
            preferences: {
                returnToStart,
                startTime,
                endTime,
            },
            categoryPreferences: selectedCategories.length > 0 ? {
                categories: selectedCategories,
                priorities: {} // Default priorities
            } : undefined,
        };

        addTrip(newTrip);
        setOpen(false);
        router.push(`/trips/${newTrip.id}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Plan a New Trip</DialogTitle>
                    <DialogDescription>
                        Enter the details below to start planning your next adventure.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-base">
                            <Type className="h-4 w-4 text-muted-foreground" />
                            Trip Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Summer Vacation 2024"
                            required
                            className="h-10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="destination" className="flex items-center gap-2 text-base">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Destination
                        </Label>
                        <Input
                            id="destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g., Paris, France"
                            required
                            className="h-10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate" className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Start Date
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate" className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                End Date
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="budget" className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            Budget (USD)
                        </Label>
                        <Input
                            id="budget"
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="e.g., 1000"
                            className="h-10"
                        />
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <Label className="flex items-center gap-2 text-base mb-3">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            Trip Categories (Optional)
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Select categories that interest you to get personalized recommendations
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                            {TRIP_CATEGORIES.map((cat) => (
                                <div
                                    key={cat.value}
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                                    onClick={() => toggleCategory(cat.value)}
                                >
                                    <Checkbox
                                        id={cat.value}
                                        checked={selectedCategories.includes(cat.value)}
                                        onCheckedChange={() => toggleCategory(cat.value)}
                                    />
                                    <label
                                        htmlFor={cat.value}
                                        className="text-sm cursor-pointer flex items-center gap-1"
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedCategories.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Selected: {selectedCategories.length} categories
                            </p>
                        )}
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h4 className="font-medium mb-3">Optimization Preferences</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="returnToStart"
                                checked={returnToStart}
                                onChange={(e) => setReturnToStart(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="returnToStart" className="font-normal cursor-pointer">
                                Return to starting point daily
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto">Create Trip</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
