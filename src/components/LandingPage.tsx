'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// 1. IMPORT THE NEW HOW-TO SECTION
import HowItWorks from '@/components/HowItWorks';

// 2. IMPORT THE FEEDBACK MODAL
import FeedbackModal from './FeedbackModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LandingPage() {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // State for Feedback Modal
  const [showFeedback, setShowFeedback] = useState(false);

  // --- LOGIN LOGIC ---
  const handleEmailLogin = async (e: React.FormEvent) => {
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` }
    });
    if (error) alert(error.message);
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
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
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
            Stop wrestling with spreadsheets. 2wards uses advanced AI to build your perfect itinerary, split costs, and guide you locally.
          </p>

          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
          >
            Start Planning Free
          </button>

          <p className="text-xs text-gray-600 mt-4">No credit card required. Free forever for solo travelers.</p>
        </div>
      </section>

      {/* --- NEW: HOW IT WORKS SECTION (Replaces old screenshot) --- */}
      <section id="how-it-works" className="px-6 pb-20">
        <HowItWorks />
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/20 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full"></div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">Ready to take off?</h2>
          <p className="text-lg text-blue-200 mb-10 max-w-xl mx-auto relative z-10">Join thousands of travelers planning smarter, not harder.</p>
          <button onClick={() => setShowLoginModal(true)} className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl relative z-10">
            Start Your Journey Now
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 bg-black pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center font-bold text-black text-xs">2</div>
              <span className="font-bold text-lg text-white">2wards <span className="text-xs text-green-500 ml-2">v2.0 (LIVE)</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">The AI-powered travel planner that helps you explore the world with confidence.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-blue-400">Features</Link></li>
              <li><Link href="#" className="hover:text-blue-400">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/blog" className="hover:text-blue-400">Travel Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-400">City Guides</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-blue-400">About Us</Link></li>
              <li>
                <button
                  onClick={() => setShowFeedback(true)}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Contact / Feedback
                </button>
              </li>
              <li><Link href="#" className="hover:text-blue-400">Careers</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* --- FEEDBACK MODAL COMPONENT --- */}
      {showFeedback && (
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* --- LOGIN MODAL COMPONENT --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">✕</button>

            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-400 rounded-xl flex items-center justify-center font-bold text-black text-xl mx-auto mb-4">2</div>
              <h3 className="text-2xl font-black text-white">Welcome Back</h3>
              <p className="text-gray-400 text-sm mt-2">Sign in to access your trips</p>
            </div>

            {/* GOOGLE BUTTON */}
            <button onClick={handleGoogleLogin} className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Sign in with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#111] px-2 text-gray-500 font-bold">Or continue with email</span></div>
            </div>

            {/* EMAIL FORM */}
            {!sent ? (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50">
                  {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
                </button>
              </form>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">✉️</div>
                <h4 className="font-bold text-green-400">Check your email!</h4>
                <p className="text-xs text-gray-400 mt-1">We sent a magic link to <b>{email}</b></p>
                <button onClick={() => setSent(false)} className="text-xs text-gray-500 mt-3 hover:text-white underline">Try different email</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}