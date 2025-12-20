'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Simple types based on your database
interface Activity {
  id: string;
  name: string;
  description: string;
  time_slot: string;
  location: { name: string };
}

interface TripDay {
  id: string;
  day_index: number;
  date: string;
  status: string;
  activities: Activity[];
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  days: TripDay[];
}

export default function TripPage() {
  const params = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  useEffect(() => {
    async function fetchTrip() {
      if (!params.id) return;
      try {
        const res = await fetch(`/api/trips/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTrip(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrip();
  }, [params.id]);

  if (loading) return <div className="p-10 text-center">Loading Trip...</div>;
  if (!trip) return <div className="p-10 text-center text-red-500">Trip not found</div>;

  const activeDay = trip.days?.[activeDayIndex];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
        <div className="mb-6">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold mt-2">{trip.name}</h1>
          <p className="text-sm text-gray-500">{trip.destination}</p>
        </div>
        
        <div className="space-y-2">
          {trip.days?.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setActiveDayIndex(index)}
              className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${
                activeDayIndex === index
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Day {index + 1}
              <div className="text-xs font-normal text-gray-400">
                {new Date(day.date).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Day {activeDayIndex + 1} Itinerary
            </h2>
            <p className="text-gray-500">
              {activeDay ? new Date(activeDay.date).toDateString() : ''}
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Invite Friends
          </button>
        </header>

        {/* THE CARDS (No Checks, Just Render) */}
        <div className="max-w-3xl space-y-4">
          {!activeDay?.activities?.length ? (
            <div className="text-center p-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No activities for this day yet.</p>
            </div>
          ) : (
            activeDay.activities.map((activity) => (
              <div 
                key={activity.id} 
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:shadow-md transition-shadow"
              >
                {/* Time Column */}
                <div className="w-20 pt-1">
                  <span className="text-sm font-bold text-gray-900 block">
                    {activity.time_slot}
                  </span>
                </div>

                {/* Content Column */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activity.name}
                  </h3>
                  <p className="text-gray-600 mt-1 text-sm">
                    {activity.description}
                  </p>
                  
                  {/* Location Tag */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      📍 {activity.location?.name || 'Location TBD'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}