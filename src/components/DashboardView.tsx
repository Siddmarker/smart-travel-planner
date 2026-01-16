'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// 1. Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- INTERFACES ---
interface DashboardProps {
  onPlanTrip: () => void;
  onDiscovery: () => void;
}

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  excerpt: string;
  created_at: string;
}

export default function DashboardView({ onPlanTrip, onDiscovery }: DashboardProps) {
  // --- STATE ---
  const [userName, setUserName] = useState('Traveler');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    async function loadDashboardData() {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Set Name
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
        setUserName(name);

        // 2. Fetch User's Trips
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (tripsData) setTrips(tripsData);
      }

      // 3. Fetch Blogs (Public)
      const { data: blogsData } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (blogsData) setBlogs(blogsData);

      setLoading(false);
    }

    loadDashboardData();
  }, []);

  // --- LOGOUT ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-8 font-sans animate-in fade-in duration-500">

      {/* --- HEADER --- */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 capitalize">Welcome back, {userName}! 👋</h1>
          <p className="text-gray-500 mt-2">Ready to explore the real India today?</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xl">
            👤
          </div>
          <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
            Logout
          </button>
        </div>
      </div>

      {/* --- MAIN ACTIONS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* PLANNER CARD */}
        <div onClick={onPlanTrip} className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl grayscale">📅</div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-6 text-blue-600">✨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Trip Planner</h2>
            <p className="text-gray-500 text-sm mb-6">Build a complete day-by-day itinerary in seconds.</p>
            <span className="text-blue-600 font-bold text-sm group-hover:underline">Start Planning ➔</span>
          </div>
        </div>

        {/* DISCOVERY CARD */}
        <div onClick={onDiscovery} className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-500 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl grayscale">🧭</div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-6 text-purple-600">🔭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Discovery Mode</h2>
            <p className="text-gray-500 text-sm mb-6">Find hidden gems, trekking trails, and local eats.</p>
            <span className="text-purple-600 font-bold text-sm group-hover:underline">Explore Now ➔</span>
          </div>
        </div>
      </div>

      {/* --- SECTION: UPCOMING TRIPS --- */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-black text-gray-900">Your Upcoming Trips ✈️</h3>
          {trips.length > 0 && <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">View All</span>}
        </div>

        {loading ? (
          <div className="w-full h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
        ) : trips.length === 0 ? (
          // Empty State
          <div onClick={onPlanTrip} className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
            <p className="text-gray-400 font-bold">No trips planned yet.</p>
            <p className="text-blue-600 text-sm mt-2 font-bold">+ Create your first trip</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📍</div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Planned</span>
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-1">{trip.destination || 'Unknown City'}</h4>
                <p className="text-xs text-gray-500">
                  {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'Date TBD'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SECTION: LATEST BLOGS (This is the NEW part) --- */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-black text-gray-900">Travel Guides & Stories ✍️</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-60 bg-gray-200 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-gray-400 text-sm italic border border-dashed border-gray-200 p-8 rounded-2xl text-center">
            No blogs posted yet. Go to Supabase and add a row to the 'blogs' table!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={blog.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-black uppercase tracking-wider">
                    Read
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>
                  <div className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read Article <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}