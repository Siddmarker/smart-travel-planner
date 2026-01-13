'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for Login
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}` }
    });
    setLoading(false);
    if (error) alert(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-600 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-400 rounded-lg flex items-center justify-center font-bold text-black">2</div>
            <span className="font-black text-xl tracking-tight text-white">2wards</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-6 text-sm font-bold text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            </div>
            <button onClick={() => document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            <span className="text-gray-400">Built for the</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">
              modern traveler.
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop wrestling with spreadsheets. 2wards uses advanced AI to build your perfect itinerary, split costs, and guide you locally—all in one place.
          </p>

          {/* LOGIN / SIGNUP FORM */}
          <div id="login-form" className="max-w-md mx-auto bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-sm">
            {!sent ? (
              <form onSubmit={handleLogin} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3 font-medium outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                  {loading ? 'Sending...' : 'Start Planning'}
                </button>
              </form>
            ) : (
              <div className="p-4 text-center">
                <p className="text-green-400 font-bold">✨ Magic link sent! Check your email.</p>
                <button onClick={() => setSent(false)} className="text-xs text-gray-500 mt-2 hover:text-white">Try another email</button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-4">No credit card required. Free forever for solo travelers.</p>
        </div>
      </section>

      {/* --- DASHBOARD PREVIEW (Fixed Image) --- */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
             {/* Replaced broken local image with a high-quality abstract travel UI placeholder */}
             <img 
               src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" 
               alt="App Dashboard Preview" 
               className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
             />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full">
                  <span className="text-sm font-bold text-white tracking-widest uppercase">Interactive Dashboard Preview</span>
                </div>
             </div>
          </div>
        </div>
        
        {/* LOGO CLOUD */}
        <div className="mt-20 text-center">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-8">Powering trips for explorers via</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale">
            {['Airbnb', 'TripAdvisor', 'Booking.com', 'Expedia', 'Skyscanner'].map(brand => (
              <span key={brand} className="text-xl md:text-2xl font-black font-serif text-white">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/20 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full"></div>
           <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">Ready to take off?</h2>
           <p className="text-lg text-blue-200 mb-10 max-w-xl mx-auto relative z-10">Join thousands of travelers planning smarter, not harder. Your next adventure is just one click away.</p>
           <button onClick={() => document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl relative z-10">
             Start Your Journey Now
           </button>
        </div>
      </section>

      {/* --- ENHANCED FOOTER --- */}
      <footer className="border-t border-white/10 bg-black pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center font-bold text-black text-xs">2</div>
              <span className="font-bold text-lg text-white">2wards</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The AI-powered travel planner that helps you explore the world with confidence. Built in Bangalore, for the world.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">𝕏</a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">In</a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">Ig</a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">AI Trip Gen</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Expense Splitter</a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Travel Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">City Guides</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Legal & Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">© 2026 2wards AI. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}