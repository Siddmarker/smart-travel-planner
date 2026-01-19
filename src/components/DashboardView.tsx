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
      }

      // 2. Fetch Blogs (Public)
      const { data: blogsData } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6); // Showing up to 6 blogs

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

      {/* --- 2 MAIN BOXES (Planner & Discover) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">

        {/* BOX 1: Multi Day Trip Planner */}
        <div onClick={onPlanTrip} className="group bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden h-64 flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-9xl grayscale">📅</div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl text-blue-600">✨</div>
              <h2 className="text-3xl font-black text-gray-900">Multi Day Trip Planner</h2>
            </div>
            {/* 2 Lines of Sub Copy */}
            <p className="text-gray-500 text-base leading-relaxed max-w-md">
              Create detailed day-by-day itineraries tailored to your interests.
              <br className="hidden md:block" /> Let AI handle the logistics while you enjoy the journey.
            </p>
            <div className="mt-6 text-blue-600 font-bold text-sm group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
              Start Planning <span>➔</span>
            </div>
          </div>
        </div>

        {/* BOX 2: Discover */}
        <div onClick={onDiscovery} className="group bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-2xl hover:border-purple-500 transition-all cursor-pointer relative overflow-hidden h-64 flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-9xl grayscale">🧭</div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl text-purple-600">🔭</div>
              <h2 className="text-3xl font-black text-gray-900">Discover</h2>
            </div>
            {/* 2 Lines of Sub Copy */}
            <p className="text-gray-500 text-base leading-relaxed max-w-md">
              Find hidden gems, trending spots, and local favorites nearby.
              <br className="hidden md:block" /> Explore the best of the city with real-time recommendations.
            </p>
            <div className="mt-6 text-purple-600 font-bold text-sm group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
              Explore Now <span>➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- BLOGS SECTION --- */}
      <div>
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-2xl font-black text-gray-900">Travel Guides & Stories ✍️</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-gray-400 text-base italic border-2 border-dashed border-gray-200 p-12 rounded-3xl text-center">
            No blogs posted yet. Go to Supabase and add a row to the 'blogs' table!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="group block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div className="h-56 overflow-hidden relative">
                  <img
                    src={blog.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-black uppercase tracking-wider shadow-sm">
                    Read Article
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                    {blog.title}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {blog.excerpt}
                  </p>
                  <div className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    Read More <span className="group-hover:translate-x-1 transition-transform">→</span>
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