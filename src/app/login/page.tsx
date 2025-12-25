'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. FAKE LOGIN (Only for the Email Form)
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/?loggedin=true'); 
    }, 1500);
  };

  // 2. REAL GOOGLE LOGIN (For the Google Button)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <Link href="/">
             <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
               2wards India
             </h1>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Welcome back, Traveler.</p>
        </div>

        {/* EMAIL FORM -> Uses Fake Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
            <input type="email" placeholder="you@example.com" className="w-full p-4 bg-gray-50 rounded-xl font-medium outline-none border-2 border-transparent focus:border-blue-500 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
            <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-xl font-medium outline-none border-2 border-transparent focus:border-blue-500 transition-all" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Sign In"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span></div>
        </div>

        {/* GOOGLE BUTTON -> Uses Real Login */}
        <button 
          type="button"
          onClick={handleGoogleLogin}   // <--- MAKE SURE THIS IS HERE!
          className="w-full py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-8">
          Don't have an account? <span className="text-blue-600 font-bold cursor-pointer">Join for free</span>
        </p>
      </div>
    </div>
  );
}