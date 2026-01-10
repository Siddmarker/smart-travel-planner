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
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
         <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 lg:h-24 flex items-center justify-between">

               {/* LOGO */}
               <div className="flex items-center gap-4 group cursor-default">
                  {/* MAKE SURE 'logo.png' IS IN YOUR PUBLIC FOLDER */}
                  <img
                     src="/logo.png"
                     alt="2wards Logo"
                     className="h-10 lg:h-16 w-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="flex flex-col justify-center leading-none space-y-1">
                     <span className="font-black text-xl lg:text-3xl tracking-tight text-white drop-shadow-md">2wards</span>
                     <span className="text-[10px] lg:text-xs font-bold text-blue-400 tracking-[0.35em] uppercase opacity-90 group-hover:opacity-100 transition-opacity">AI Planner</span>
                  </div>
               </div>

               {/* DESKTOP NAV */}
               <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-400">
                  <a href="#features" className="hover:text-white transition-colors hover:tracking-wide duration-300">Features</a>
                  <a href="#how-it-works" className="hover:text-white transition-colors hover:tracking-wide duration-300">How it works</a>
                  <button
                     onClick={() => setIsLoginMode(true)}
                     className="text-black bg-white hover:bg-gray-200 px-6 py-3 rounded-xl transition-all font-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105"
                  >
                     Sign In
                  </button>
               </div>

               {/* MOBILE HAMBURGER */}
               <button
                  className="lg:hidden text-white text-2xl"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               >
                  {mobileMenuOpen ? '✕' : '☰'}
               </button>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {mobileMenuOpen && (
               <div className="lg:hidden absolute top-20 left-0 w-full bg-[#0A0A0A] border-b border-white/10 p-6 flex flex-col gap-6 animate-fade-in-down shadow-2xl">
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-gray-300">Features</a>
                  <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-gray-300">How it works</a>
                  <button
                     onClick={() => { setIsLoginMode(true); setMobileMenuOpen(false); }}
                     className="w-full bg-white text-black py-4 rounded-xl font-bold"
                  >
                     Sign In
                  </button>
               </div>
            )}
         </nav>

         {/* --- HERO SECTION --- */}
         <section className="relative pt-32 lg:pt-44 pb-12 lg:pb-20 px-6 flex flex-col items-center text-center max-w-5xl mx-auto">

            {/* Background Glow Effect */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] lg:w-[600px] h-[300px] lg:h-[400px] bg-blue-600/20 blur-[80px] lg:blur-[120px] rounded-full pointer-events-none"></div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-blue-300 mb-6 lg:mb-8 animate-fade-in-up hover:bg-white/10 transition-colors cursor-default">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               AI-Powered Travel Agent v2.0
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-7xl font-black tracking-tight mb-6 lg:mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
               The smartest way to <br /> plan your next escape.
            </h1>

            {/* Subheadline */}
            <p className="text-base lg:text-xl text-gray-400 max-w-2xl mb-10 lg:mb-12 leading-relaxed font-medium">
               Ditch the spreadsheets. 2wards uses advanced AI to build personalized itineraries, track budgets, and sync with friends—all in seconds.
            </p>

            {/* LOGIN / CTA AREA */}
            <div className="w-full max-w-md relative z-10">
               {!isLoginMode ? (
                  <button
                     onClick={() => setIsLoginMode(true)}
                     className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-black text-lg py-4 lg:py-5 rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)]"
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
                           placeholder="Enter your email address"
                           className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium text-center"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                        />
                        <button
                           disabled={loading}
                           className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
                        >
                           {loading ? 'Sending Link...' : 'Send Login Link 🚀'}
                        </button>
                     </form>

                     {/* Divider */}
                     <div className="flex items-center gap-4 opacity-50 py-2">
                        <div className="h-px bg-white/20 flex-1"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Or continue with</span>
                        <div className="h-px bg-white/20 flex-1"></div>
                     </div>

                     {/* Google Button */}
                     <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 hover:scale-[1.01]"
                     >
                        <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="G" />
                        Sign in with Google
                     </button>

                  </div>
               )}
               <p className="text-xs text-gray-500 mt-6 font-medium">No credit card required. Free forever for solo travelers.</p>
            </div>

            {/* --- VISUAL PREVIEW (USING YOUR DASHBOARD SCREENSHOT) --- */}
            <div className="mt-20 lg:mt-24 w-full relative group px-2 lg:px-0">
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10"></div>
               <div className="border border-white/10 bg-[#0A0A0A] rounded-3xl p-2 lg:p-3 shadow-2xl transform rotate-x-12 perspective-1000 group-hover:scale-[1.01] transition-transform duration-700">

                  {/* REPLACE '/dashboard-preview.png' WITH YOUR ACTUAL IMAGE PATH */}
                  <img
                     src="/dashboard-preview.png"
                     alt="2wards App Dashboard"
                     className="w-full h-auto rounded-2xl object-cover opacity-90 shadow-2xl border border-white/5"
                  />

               </div>
            </div>
         </section>

         {/* --- SOCIAL PROOF --- */}
         <section className="py-12 border-y border-white/5 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-6 text-center">
               <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-10">Powering trips for explorers worldwide</p>
               <div className="flex flex-wrap justify-center gap-8 lg:gap-16 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  {/* Brands List - Clean Typography */}
                  {['Airbnb', 'TripAdvisor', 'Booking.com', 'Expedia', 'Skyscanner'].map(brand => (
                     <span key={brand} className="text-xl lg:text-2xl font-bold font-serif text-white cursor-default">
                        {brand}
                     </span>
                  ))}
               </div>
            </div>
         </section>

         {/* --- FEATURES GRID --- */}
         <section id="features" className="py-24 lg:py-40 px-6">
            <div className="max-w-7xl mx-auto">
               <div className="text-center mb-16 lg:mb-24">
                  <h2 className="text-3xl md:text-6xl font-black mb-6 lg:mb-8">Built for the <span className="text-blue-500">modern traveler</span>.</h2>
                  <p className="text-gray-400 max-w-xl mx-auto text-base lg:text-lg">Everything you need to go from "I want to travel" to "Boarding now".</p>
               </div>

               <div className="grid md:grid-cols-3 gap-6 lg:gap-8">

                  {/* Feature 1 */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 lg:p-10 hover:border-blue-500/30 transition-all hover:-translate-y-2 duration-300 group">
                     <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl lg:text-3xl mb-6 lg:mb-8 group-hover:scale-110 transition-transform">🤖</div>
                     <h3 className="text-xl lg:text-2xl font-bold mb-4 text-white">AI Itineraries</h3>
                     <p className="text-sm text-gray-400 leading-relaxed">Stop spending hours researching. Our AI builds a day-by-day plan based on your vibe, budget, and taste in seconds.</p>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 lg:p-10 hover:border-purple-500/30 transition-all hover:-translate-y-2 duration-300 group">
                     <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl lg:text-3xl mb-6 lg:mb-8 group-hover:scale-110 transition-transform">💸</div>
                     <h3 className="text-xl lg:text-2xl font-bold mb-4 text-white">Smart Splitwise</h3>
                     <p className="text-sm text-gray-400 leading-relaxed">Traveling with friends? Track expenses and split bills automatically. No more awkward math at dinner.</p>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 lg:p-10 hover:border-green-500/30 transition-all hover:-translate-y-2 duration-300 group">
                     <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-2xl lg:text-3xl mb-6 lg:mb-8 group-hover:scale-110 transition-transform">🌍</div>
                     <h3 className="text-xl lg:text-2xl font-bold mb-4 text-white">Interactive Discovery</h3>
                     <p className="text-sm text-gray-400 leading-relaxed">Find hidden gems, top-rated cafes, and adventure spots near you with our live map integration.</p>
                  </div>

               </div>
            </div>
         </section>

         {/* --- STATS SECTION --- */}
         <section className="py-16 lg:py-24 border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#0A0A0A]">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 text-center">
               {[
                  { label: 'Active Users', val: '10k+' },
                  { label: 'Cities Mapped', val: '500+' },
                  { label: 'Itineraries Built', val: '1M+' },
                  { label: 'Time Saved', val: '∞' },
               ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                     <div className="text-3xl lg:text-6xl font-black text-white tracking-tighter">{stat.val}</div>
                     <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
               ))}
            </div>
         </section>

         {/* --- CTA FOOTER --- */}
         <section className="py-24 lg:py-40 px-6 text-center">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 p-10 lg:p-16 rounded-[3rem] relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-600/10 blur-[120px] group-hover:bg-blue-600/20 transition-all duration-700"></div>
               <div className="relative z-10">
                  <h2 className="text-3xl lg:text-6xl font-black mb-6 lg:mb-8 tracking-tight">Ready to take off?</h2>
                  <p className="text-gray-300 mb-8 lg:mb-10 text-base lg:text-lg">Join thousands of travelers planning smarter, not harder.</p>
                  <button
                     onClick={() => setIsLoginMode(true)}
                     className="bg-white text-black font-black text-base lg:text-lg px-8 lg:px-12 py-4 lg:py-5 rounded-full hover:scale-105 transition-transform shadow-2xl shadow-blue-500/20"
                  >
                     Start Your Journey Now
                  </button>
               </div>
            </div>
         </section>

         {/* --- SIMPLE FOOTER --- */}
         <footer className="py-10 border-t border-white/5 text-center text-xs font-medium text-gray-600">
            <p>© 2024 2wards AI. Designed for travelers.</p>
         </footer>

      </div>
   );
}