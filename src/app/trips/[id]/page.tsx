
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClusterView } from '@/components/Trips/ClusterView';
import { ChatPanel } from '@/components/Social/ChatPanel';
import { ExpensePanel } from '@/components/Social/ExpensePanel';

// Placeholder for future components
const MapView = () => <div className="p-4 bg-gray-50 rounded text-center">Map integration coming soon...</div>;

interface Trip {
    id: string;
    name: string;
    tripState: string;
    days: any[]; // IDay[]
}

export default function TripDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    const fetchTrip = async () => {
        try {
            const res = await fetch(`/api/trips/${id}`);
            if (res.ok) {
                const data = await res.json();
                console.log("DEBUG: API Response Data:", data);
                setTrip(data);
            } else {
                console.error("Failed to fetch trip", await res.text());
                setTrip(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrip();
    }, [id]);

    const handleStartTrip = async () => {
        setLoading(true); // Show local loading state immediately
        try {
            const res = await fetch(`/api/trips/${id}/start`, { method: 'POST' });
            if (res.ok) {
                await fetchTrip(); // Refresh to see Active state and populated days
            } else {
                const err = await res.json();
                alert(err.error || "Failed to start");
            }
        } catch (error) {
            console.error("Failed to start trip", error);
            alert("Network error starting trip");
        } finally {
            setLoading(false);
        }
    };

    console.log("🕵️‍♂️ DEBUG SCOPE:");
    console.log("1. Is Loading?", loading);
    console.log("2. Trip Data:", trip);
    console.log("3. Trip Days:", trip?.days);

    if (loading) return <div className="p-12 text-center">Loading Dashboard...</div>;

    if (!trip) {
        console.warn("❌ Trip is falsy, rendering NotFound");
        return <div className="p-12 text-center text-red-500">Trip not found</div>;
    }

    const currentDay = trip.days?.[currentDayIndex];

    return (
        <div className="container mx-auto h-[calc(100vh-64px)] flex flex-col">
            {/* Header */}
            <header className="border-b p-4 flex justify-between items-center bg-white shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-bold">{trip.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${trip.tripState === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {trip.tripState}
                        </span>
                        <span>• Day {currentDayIndex + 1}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {trip.tripState === 'DRAFT' && (
                        <Button onClick={handleStartTrip} variant="default" disabled={loading}>
                            {loading ? 'Generating...' : '🚀 Start Planning'}
                        </Button>
                    )}
                    <Button variant="outline" size="sm">Invite Friends</Button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Timeline */}
                <aside className="w-64 border-r bg-white p-4 overflow-y-auto hidden md:block">
                    <h2 className="font-semibold mb-4 text-gray-700">Itinerary</h2>
                    <div className="space-y-2">
                        {trip.days?.map((day: any, idx: number) => (
                            <div
                                key={day.id || idx}
                                onClick={() => setCurrentDayIndex(idx)}
                                className={`p-3 rounded cursor-pointer border transition-colors ${idx === currentDayIndex ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50 border-transparent'
                                    }`}
                            >
                                <p className="font-medium text-sm">Day {day.dayIndex}</p>
                                <p className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString()}</p>
                                <span className="text-[10px] text-gray-400 capitalize">{day.status}</span>
                            </div>
                        ))}
                        {(!trip.days || trip.days.length === 0) && (
                            <p className="text-sm text-gray-400 italic">No days generated yet. Start the trip to begin.</p>
                        )}
                    </div>
                </aside>

                {/* Center: Main View */}
                <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {currentDay ? (
                        <Tabs defaultValue="clusters" className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <TabsList>
                                    <TabsTrigger value="clusters">✨ Vibe Check</TabsTrigger>
                                    <TabsTrigger value="map">🗺️ Map</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="clusters" className="flex-1">
                                <ClusterView day={currentDay} refreshDay={fetchTrip} />
                            </TabsContent>
                            <TabsContent value="map" className="flex-1 h-full min-h-[400px]">
                                <MapView />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400">
                            <p className="mb-2">Ready to plan?</p>
                            {trip.tripState === 'DRAFT' && (
                                <Button onClick={handleStartTrip} disabled={loading}>
                                    {loading ? 'Generating Custom Itinerary...' : 'Start Trip & Generate Itinerary'}
                                </Button>
                            )}
                        </div>
                    )}
                </main>

                {/* Right: Social Panel */}
                <aside className="w-96 border-l bg-white flex flex-col border-l-2">
                    <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                        <TabsList className="w-full rounded-none border-b p-0 h-10">
                            <TabsTrigger value="chat" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary hover:bg-gray-50">Chat</TabsTrigger>
                            <TabsTrigger value="expenses" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary hover:bg-gray-50">Bills</TabsTrigger>
                        </TabsList>

                        <TabsContent value="chat" className="flex-1 m-0 p-0 overflow-hidden relative">
                            <div className="absolute inset-0">
                                <ChatPanel tripId={trip.id} />
                            </div>
                        </TabsContent>
                        <TabsContent value="expenses" className="flex-1 m-0 p-0 overflow-hidden relative">
                            <div className="absolute inset-0">
                                <ExpensePanel tripId={trip.id} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </aside>
            </div>
        </div>
    );
}
