'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // 1. MAGIC LINK LOGIN
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) alert(error.message);
    else alert('Check your email for the login link!');
    setLoading(false);
  };

  // 2. GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* UPDATED LOGO SECTION */}
          <div className="flex items-center gap-3">
            {/* Custom Logo Image */}
            <img
              src="/logo.png"
              alt="2wards Logo"
              className="h-10 w-auto object-contain"
            />

            {/* Brand Text */}
            <div className="flex flex-col leading-none">
              <span className="font-black text-xl tracking-tight text-white">2wards</span>
              <span className="text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase">AI Planner</span>
            </div>
          </div>

          <div className="flex gap-6 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <button
              onClick={() => setIsLoginMode(true)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center max-w-5xl mx-auto">

        {/* Background Glow Effect */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          AI-Powered Travel Agent v2.0
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
          The smartest way to <br /> plan your next escape.
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Ditch the spreadsheets. 2wards uses advanced AI to build personalized itineraries, track budgets, and sync with friends—all in seconds.
        </p>

        {/* LOGIN / CTA AREA */}
        <div className="w-full max-w-md relative z-10">
          {!isLoginMode ? (
            <button
              onClick={() => setIsLoginMode(true)}
              className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-bold text-lg py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              Start Planning Free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          ) : (
            <div className="animate-fade-in space-y-4">

              {/* Email Form */}
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-medium text-center"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  {loading ? 'Sending Link...' : 'Send Login Link 🚀'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 opacity-50">
                <div className="h-px bg-white/20 flex-1"></div>
                <span className="text-xs font-medium uppercase tracking-widest">Or continue with</span>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="G" />
                Sign in with Google
              </button>

            </div>
          )}
          <p className="text-xs text-gray-500 mt-4">No credit card required. Free forever for solo travelers.</p>
        </div>

        {/* Visual Preview (CSS Art Dashboard) */}
        <div className="mt-20 w-full relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10"></div>
          <div className="border border-white/10 bg-[#0A0A0A] rounded-2xl p-2 shadow-2xl transform rotate-x-12 perspective-1000 group-hover:scale-[1.01] transition-transform duration-700">
            <div className="bg-[#0F0F0F] rounded-xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
              <div className="absolute top-10 left-10 right-10 bottom-0 bg-[#151515] rounded-t-xl border-t border-l border-r border-white/5 p-6 grid grid-cols-3 gap-6">

                {/* Fake Sidebar */}
                <div className="col-span-1 space-y-3">
                  <div className="h-20 bg-white/5 rounded-lg w-full animate-pulse"></div>
                  <div className="h-8 bg-white/5 rounded-lg w-3/4"></div>
                  <div className="h-8 bg-white/5 rounded-lg w-1/2"></div>
                  <div className="h-8 bg-white/5 rounded-lg w-2/3"></div>
                </div>

                {/* Fake Map Area */}
                <div className="col-span-2 space-y-4">
                  <div className="h-64 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/10 flex items-center justify-center text-blue-500/20 font-black text-4xl tracking-widest">
                    AI MAP ENGINE
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF --- */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-8">Powering trips for explorers worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
            {/* Brands List */}
            {['Airbnb', 'TripAdvisor', 'Booking.com', 'Expedia', 'Skyscanner'].map(brand => (
              <span key={brand} className="text-xl font-bold font-serif text-white hover:text-blue-400 transition-colors cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Built for the <span className="text-blue-500">modern traveler</span>.</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Everything you need to go from "I want to travel" to "Boarding now".</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Feature 1 */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🤖</div>
              <h3 className="text-xl font-bold mb-3 text-white">AI Itineraries</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Stop spending hours researching. Our AI builds a day-by-day plan based on your vibe, budget, and taste in seconds.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">💸</div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Splitwise</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Traveling with friends? Track expenses and split bills automatically. No more awkward math at dinner.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:border-green-500/30 transition-colors group">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🌍</div>
              <h3 className="text-xl font-bold mb-3 text-white">Interactive Discovery</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Find hidden gems, top-rated cafes, and adventure spots near you with our live map integration.</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Active Users', val: '10k+' },
            { label: 'Cities Mapped', val: '500+' },
            { label: 'Itineraries Built', val: '1M+' },
            { label: 'Time Saved', val: '∞' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.val}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 p-12 rounded-[3rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/10 blur-[100px]"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-6">Ready to take off?</h2>
            <p className="text-gray-400 mb-8">Join thousands of travelers planning smarter, not harder.</p>
            <button
              onClick={() => setIsLoginMode(true)}
              className="bg-white text-black font-bold px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-xl"
            >
              Start Your Journey Now
            </button>
          </div>
        </div>
      </section>

      {/* --- SIMPLE FOOTER --- */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-gray-600">
        <p>© 2024 2wards AI. Designed for travelers.</p>
      </footer>

    </div>
  );
}