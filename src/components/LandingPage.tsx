'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // This forces the user back to the Homepage (avoids /login 404s)
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Login Error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="2wards Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-xl tracking-tight">2wards</span>
          </div>
          
          {/* Login Button (Small) */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="px-5 py-2 bg-black text-white text-xs font-bold rounded-full hover:scale-105 transition-transform"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-16">
        
        <div className="animate-fade-in-up max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
              ✨ The AI Travel Revolution is Here
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Plan trips that match your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">VIBE.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop searching for "places near me." 2wards uses AI to scan thousands of spots and build a perfect itinerary just for you—in seconds.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-4 bg-black text-white text-sm font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <img 
                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                className="w-5 h-5" 
                alt="G" 
              />
              {loading ? 'Launching...' : 'Continue with Google'}
            </button>
            <p className="text-xs text-gray-400 mt-2 md:mt-0">No credit card required.</p>
          </div>
        </div>

        {/* 3. APP PREVIEW (MOCKUP) */}
        <div className="mt-20 relative w-full max-w-4xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-50 rounded-3xl border border-gray-200 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
            <div className="text-center p-8">
               <div className="text-6xl mb-4">🗺️ 🤖 📍</div>
               <h3 className="text-xl font-bold text-gray-400">Your AI Dashboard awaits...</h3>
               <p className="text-sm text-gray-400 mt-2">Login to start planning.</p>
            </div>
          </div>
        </div>

      </main>

      {/* 4. FOOTER */}
      <footer className="py-8 text-center text-gray-400 text-xs border-t border-gray-100">
        <p>© {new Date().getFullYear()} 2wards. All rights reserved.</p>
      </footer>
    </div>
  );
}