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
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5 group cursor-default">
            <img src="/logo.png" alt="2wards Logo" className="h-16 w-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
            <div className="flex flex-col justify-center leading-none space-y-1">
              <span className="font-black text-3xl tracking-tight text-white drop-shadow-md">2wards</span>
              <span className="text-xs font-bold text-blue-400 tracking-[0.35em] uppercase opacity-90 group-hover:opacity-100 transition-opacity">AI Planner</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400">
            <a href="#features" className="hover:text-white transition-colors hover:tracking-wide duration-300">Features</a>
            <a href="#blog" className="hover:text-white transition-colors hover:tracking-wide duration-300">Blog</a>
            <button onClick={() => setIsLoginMode(true)} className="text-black bg-white hover:bg-gray-200 px-6 py-3 rounded-xl transition-all font-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105">Sign In</button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-44 pb-20 px-6 flex flex-col items-center text-center max-w-6xl mx-auto">
        
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-blue-300 mb-8 animate-fade-in-up hover:bg-white/10 transition-colors cursor-default">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          AI-Powered Travel Agent v2.0
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
          The smartest way to <br /> plan your next escape.
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed font-medium">
          Ditch the spreadsheets. 2wards uses advanced AI to build personalized itineraries, track budgets, and sync with friends—all in seconds.
        </p>

        <div className="w-full max-w-md relative z-10">
          {!isLoginMode ? (
            <button onClick={() => setIsLoginMode(true)} className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-black text-lg py-5 rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)]">
              Start Planning Free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          ) : (
            <div className="animate-fade-in space-y-4">
                <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                  <input type="email" placeholder="Enter your email address" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium text-center" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <button disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30">{loading ? 'Sending Link...' : 'Send Login Link 🚀'}</button>
                </form>
                <div className="flex items-center gap-4 opacity-50 py-2"><div className="h-px bg-white/20 flex-1"></div><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Or continue with</span><div className="h-px bg-white/20 flex-1"></div></div>
                <button onClick={handleGoogleLogin} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 hover:scale-[1.01]"><img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="G" />Sign in with Google</button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-6 font-medium">No credit card required. Free forever for solo travelers.</p>
        </div>

        {/* --- APP MOCKUP (Replaces Empty Box) --- */}
        <div className="mt-24 w-full relative group perspective-1000">
           <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10"></div>
           <div className="border border-white/10 bg-[#0A0A0A] rounded-3xl p-3 shadow-2xl transform rotate-x-6 group-hover:scale-[1.01] group-hover:rotate-x-0 transition-all duration-700 ease-out">
              <div className="bg-[#0F0F0F] rounded-2xl overflow-hidden aspect-[16/9] relative">
                 
                 {/* 1. Background Map Image */}
                 <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=80" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" 
                    alt="App Dashboard Background"
                 />
                 
                 {/* 2. Floating UI Elements (Glassmorphism) */}
                 <div className="absolute inset-0 p-8 flex gap-6">
                    {/* Sidebar Mockup */}
                    <div className="hidden md:flex flex-col w-64 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 gap-3 shadow-xl">
                        <div className="h-8 bg-white/20 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded-lg w-1/2 mb-4"></div>
                        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg border border-white/5"></div>)}
                        <div className="mt-auto h-20 bg-gradient-to-br from-blue-600/40 to-purple-600/40 rounded-lg border border-white/10"></div>
                    </div>

                    {/* Main Content Mockup */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Header */}
                        <div className="h-16 w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-between px-6 shadow-xl">
                            <div className="h-6 w-32 bg-white/20 rounded"></div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-500"></div>
                                <div className="h-8 w-8 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        {/* Cards Grid */}
                        <div className="grid grid-cols-3 gap-4 h-full">
                            <div className="col-span-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
                                <div className="h-full w-full bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold tracking-widest text-white/30 uppercase">Interactive Map</div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex flex-col justify-center gap-2">
                                    <div className="text-xs font-bold text-gray-400 uppercase">Budget Tracker</div>
                                    <div className="text-2xl font-black text-green-400">₹45,000</div>
                                </div>
                                <div className="flex-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex flex-col justify-center gap-2">
                                    <div className="text-xs font-bold text-gray-400 uppercase">Trip Vibe</div>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-[10px] rounded border border-purple-500/30">Chill</span>
                                        <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-[10px] rounded border border-orange-500/30">Foodie</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      </section>

      {/* --- FEATURES GRID (EXPANDED) --- */}
      <section id="features" className="py-32 px-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <h2 className="text-3xl md:text-5xl font-black mb-6">Everything you need to <span className="text-blue-500">travel smarter</span>.</h2>
             <p className="text-gray-400 max-w-xl mx-auto">From daydreams to departure gates, we've got you covered.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             {/* Feature 1 */}
             <div className="bg-[#0F0F0F] border border-white/5 rounded-[2rem] p-8 hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-blue-900/20 text-blue-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🤖</div>
                <h3 className="text-xl font-bold mb-3 text-white">AI Itineraries</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Stop spending hours researching. Our AI builds a day-by-day plan based on your vibe, budget, and taste.</p>
             </div>
             {/* Feature 2 */}
             <div className="bg-[#0F0F0F] border border-white/5 rounded-[2rem] p-8 hover:border-purple-500/30 transition-all hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-purple-900/20 text-purple-400 rounded-2xl flex items-center justify-center text-2xl mb-6">💸</div>
                <h3 className="text-xl font-bold mb-3 text-white">Smart Expense Split</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Traveling with friends? Track expenses and split bills automatically. No more awkward math at dinner.</p>
             </div>
             {/* Feature 3 */}
             <div className="bg-[#0F0F0F] border border-white/5 rounded-[2rem] p-8 hover:border-green-500/30 transition-all hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-green-900/20 text-green-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🌍</div>
                <h3 className="text-xl font-bold mb-3 text-white">Hidden Gems</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Find local secrets, top-rated cafes, and adventure spots near you with our live interactive map.</p>
             </div>
             {/* Feature 4 */}
             <div className="bg-[#0F0F0F] border border-white/5 rounded-[2rem] p-8 hover:border-pink-500/30 transition-all hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-pink-900/20 text-pink-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🤝</div>
                <h3 className="text-xl font-bold mb-3 text-white">Real-time Collab</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Invite friends to your trip board. Vote on places, chat, and build the perfect plan together live.</p>
             </div>
             {/* Feature 5 */}
             <div className="bg-[#0F0F0F] border border-white/5 rounded-[2rem] p-8 hover:border-orange-500/30 transition-all hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-orange-900/20 text-orange-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🎒</div>
                <h3 className="text-xl font-bold mb-3 text-white">Packing Assistant</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Never forget your charger again. Get auto-generated packing lists based on destination weather.</p>
             </div>
             {/* Feature 6 */}
             <div className="bg-[#0F0F0F] border border-white/5 rounded-[2rem] p-8 hover:border-cyan-500/30 transition-all hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-cyan-900/20 text-cyan-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🗺️</div>
                <h3 className="text-xl font-bold mb-3 text-white">Offline Maps</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Save your itinerary and maps offline. Access your plan even when you lose signal in the mountains.</p>
             </div>
          </div>
        </div>
      </section>

      {/* --- BLOG SECTION (SEO & RESOURCES) --- */}
      <section id="blog" className="py-32 px-6 border-t border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
               <div>
                  <h2 className="text-3xl font-black mb-2">Travel Guides & Tips</h2>
                  <p className="text-gray-400 text-sm">Curated advice for your next adventure.</p>
               </div>
               <button className="hidden md:block text-blue-400 font-bold hover:text-white transition-colors">View all articles →</button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {[
                  { title: "10 Hidden Gems in Bali You Can't Miss", cat: "Destinations", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80" },
                  { title: "How to Plan a Group Trip Without Fighting", cat: "Tips & Tricks", img: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=600&q=80" },
                  { title: "The Ultimate Packing List for Solo Travelers", cat: "Guides", img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80" }
               ].map((blog, i) => (
                  <div key={i} className="group cursor-pointer">
                     <div className="overflow-hidden rounded-2xl mb-4 h-64 border border-white/5 relative">
                        <img src={blog.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{blog.cat}</div>
                     </div>
                     <h3 className="text-xl font-bold leading-tight group-hover:text-blue-400 transition-colors">{blog.title}</h3>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <section className="py-32 px-6 text-center">
         <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 p-16 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/10 blur-[120px] group-hover:bg-blue-600/20 transition-all duration-700"></div>
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Ready to take off?</h2>
               <p className="text-gray-300 mb-10 text-lg">Join thousands of travelers planning smarter, not harder.</p>
               <button onClick={() => setIsLoginMode(true)} className="bg-white text-black font-black text-lg px-12 py-5 rounded-full hover:scale-105 transition-transform shadow-2xl shadow-blue-500/20">
                 Start Your Journey Now
               </button>
            </div>
         </div>
      </section>

      {/* --- FAT FOOTER --- */}
      <footer className="py-20 border-t border-white/5 bg-[#080808] text-sm">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-black text-xs">2w</div>
                  <span className="font-bold text-xl">2wards</span>
               </div>
               <p className="text-gray-500 max-w-xs mb-6">The AI-powered travel assistant that helps you plan, budget, and explore the world with friends.</p>
               <div className="flex gap-4 text-gray-400">
                  <a href="#" className="hover:text-white transition-colors">Twitter</a>
                  <a href="#" className="hover:text-white transition-colors">Instagram</a>
                  <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
               </div>
            </div>
            
            <div className="flex flex-col gap-4">
               <h4 className="font-bold text-white">Product</h4>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Features</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Pricing</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Download App</a>
            </div>

            <div className="flex flex-col gap-4">
               <h4 className="font-bold text-white">Resources</h4>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Blog</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Community</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Help Center</a>
            </div>

            <div className="flex flex-col gap-4">
               <h4 className="font-bold text-white">Company</h4>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">About Us</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Careers</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
               <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-xs">
            <p>© 2024 2wards AI. Made with ❤️ for travelers.</p>
         </div>
      </footer>

    </div>
  );
}