'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- THE FIXED LOGIN LOGIC ---
  const handleLogin = async () => {
    setLoading(true);

    // 1. Determine if we are on Localhost or Production
    // This check prevents the "Mismatch" error by ensuring the URL matches Supabase exactly.
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    const redirectUrl = isLocal
      ? 'http://localhost:3000/auth/callback'
      : 'https://www.2wards.in/auth/callback';

    console.log("🔐 Initiating OAuth login...");
    console.log("Redirect URL:", redirectUrl);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("❌ OAuth initiation error:", error.message);
        alert("Login failed: " + error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100">

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-lg">2</div>
            <span className="text-xl font-black tracking-tight">2wards</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#reviews" className="hover:text-black transition-colors">Reviews</a>
            <a href="#" className="hover:text-black transition-colors">Pricing</a>
          </nav>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            ✨ AI-Powered Travel Planning
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Plan your next trip <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">in seconds, not hours.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Build personalized itineraries, collaborate with friends, and track expenses in one beautiful workspace.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full md:w-auto bg-black text-white h-14 px-8 rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <><span>🚀</span> Start Planning Free</>
              )}
            </button>
            <button className="w-full md:w-auto bg-gray-100 text-gray-900 h-14 px-8 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors">
              View Demo
            </button>
          </div>
        </div>

        {/* Abstract Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent rounded-full blur-3xl -z-10 opacity-60 pointer-events-none" />
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🗺️"
              title="Interactive Map"
              desc="Drag, drop, and visualize your entire trip on a smart map that syncs instantly with your list."
            />
            <FeatureCard
              icon="✨"
              title="AI Genius"
              desc="Not sure where to go? Let our AI suggest hidden gems and optimize your route for less travel time."
            />
            <FeatureCard
              icon="💸"
              title="Expense Splitting"
              desc="Track who paid what and settle debts instantly. Perfect for group trips with friends."
            />
          </div>
        </div>
      </section>

      {/* --- LOVED BY TRAVELERS --- */}
      <section id="reviews" className="py-24 bg-black text-white overflow-hidden relative">
        <div className="container mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Loved by <span className="text-blue-500">Travelers</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From solo backpackers to large family groups, see how 2wards is changing the way India travels.
          </p>
        </div>

        <div className="flex overflow-x-auto pb-12 gap-6 px-6 md:px-20 snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing">
          <ReviewCard
            initial="A"
            name="Arjun Mehta"
            role="Solo Traveler"
            text="Finally an app that understands 'Vibe' based travel! The discovery mode found a hidden cafe right next to my hotel in Bangalore that wasn't on any other map."
            color="bg-blue-600"
          />
          <ReviewCard
            initial="S"
            name="Sarah Jenkins"
            role="Backpacker"
            text="The AI itinerary generator saved me hours of research. I just entered 'Relaxing' and 'Coorg', and it gave me a perfect 3-day plan instantly."
            color="bg-purple-600"
          />
          <ReviewCard
            initial="R"
            name="Rahul & Team"
            role="Group Trip"
            text="Used the split cost feature for our Goa trip. Usually, money talks are awkward, but this made it seamless. No fighting over bills!"
            color="bg-green-600"
          />
          <ReviewCard
            initial="P"
            name="Priya Sharma"
            role="Weekend Explorer"
            text="I love the 'Discovery Mode'. I found a beautiful trekking spot just 20km from my house that I never knew existed. Highly recommended!"
            color="bg-pink-600"
          />
          <ReviewCard
            initial="D"
            name="David Chen"
            role="Digital Nomad"
            text="Perfect for solo travelers. I felt safe and guided. The local safety scores gave me peace of mind when exploring new areas at night."
            color="bg-indigo-600"
          />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white text-black rounded flex items-center justify-center font-bold text-xs">2</div>
            <span className="font-bold text-white tracking-tight">2wards</span>
          </div>
          <div className="text-sm font-medium">
            © {new Date().getFullYear()} 2wards Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

// --- SUB COMPONENTS ---

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm font-medium">{desc}</p>
    </div>
  );
}

function ReviewCard({ initial, name, role, text, color }: { initial: string, name: string, role: string, text: string, color: string }) {
  return (
    <div className="flex-none w-80 md:w-[400px] bg-[#111] p-8 rounded-3xl border border-gray-800 snap-center hover:border-gray-600 transition-colors">
      <div className="text-yellow-400 mb-4 text-xs tracking-widest">★★★★★</div>
      <p className="text-gray-300 mb-6 text-sm leading-relaxed italic opacity-90">
        "{text}"
      </p>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
          {initial}
        </div>
        <div>
          <h4 className="font-bold text-sm text-white">{name}</h4>
          <p className="text-xs text-gray-500 font-medium">{role}</p>
        </div>
      </div>
    </div>
  );
}