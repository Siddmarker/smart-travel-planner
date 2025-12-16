
'use client';

import { useState } from 'react';

export default function TestPlanner() {
    const [tripId, setTripId] = useState<string>('');
    const [dayJson, setDayJson] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const createTrip = async () => {
        setLoading(true);
        addLog('Creating Trip Shell...');
        try {
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: 'Goa',
                    startDate: '2024-12-25',
                    endDate: '2024-12-27',
                    budget: 'Medium',
                    categories: ['Beach', 'Party', 'Food'],
                    name: 'Test Goa Trip'
                })
            });
            const data = await res.json();
            if (data.trip_id) {
                setTripId(data.trip_id);
                addLog(`Trip Created: ${data.trip_id}`);
            } else {
                addLog(`Error: ${JSON.stringify(data)}`);
            }
        } catch (e: any) {
            addLog(`Exception: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const generateDay = async () => {
        if (!tripId) return alert('Create trip first');
        setLoading(true);
        addLog('Generating Day 1...');
        try {
            const res = await fetch('/api/itinerary/generate-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trip_id: tripId,
                    day_index: 1
                })
            });
            const data = await res.json();
            setDayJson(data);
            addLog('Day Generated!');
        } catch (e: any) {
            addLog(`Exception: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Multi-Day Planner Logic Test</h1>

            <div className="space-x-4">
                <button
                    onClick={createTrip}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    1. Create Trip Shell (Goa)
                </button>

                <button
                    onClick={generateDay}
                    disabled={!tripId || loading}
                    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                    2. Generate Day 1 (Cluster Logic)
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 h-96 overflow-auto bg-gray-50 rounded">
                    <h3 className="font-bold mb-2">Logs</h3>
                    {logs.map((l, i) => <div key={i} className="text-xs font-mono">{l}</div>)}
                </div>
                <div className="border p-4 h-96 overflow-auto bg-gray-900 text-green-400 rounded">
                    <h3 className="font-bold mb-2">JSON Result</h3>
                    <pre className="text-xs">{JSON.stringify(dayJson, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
