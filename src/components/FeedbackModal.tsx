'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Safe Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if keys exist to prevent runtime crash
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            alert("Please enter a message!");
            return;
        }

        if (!supabase) {
            console.error("❌ Supabase Client missing. Check .env.local keys.");
            alert("System Error: Feedback service unavailable. Please try again later.");
            return;
        }

        setSending(true);

        try {
            const { error } = await supabase
                .from('feedback')
                .insert([
                    {
                        message: message,
                        user_email: email || null, // Handle empty email
                        page_url: window.location.pathname,
                        status: 'NEW'
                    }
                ]);

            if (error) {
                console.error("❌ Supabase Error:", error);
                alert(`Failed to send: ${error.message}`);
            } else {
                setSent(true);
                setTimeout(() => {
                    setSent(false);
                    setMessage('');
                    setEmail('');
                    onClose();
                }, 2000);
            }

        } catch (err) {
            console.error("❌ Unexpected Error:", err);
            alert("An unexpected error occurred.");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-white mb-1">� Share Feedback</h3>
                <p className="text-xs text-gray-400 mb-6">Found a bug? Have an idea? Let us know.</p>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Message</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Tell us what you think..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <button
                            disabled={sending}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                'Send Feedback'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-10">
                        <div className="text-3xl mb-4">✅</div>
                        <h4 className="text-xl font-bold text-white mb-2">Thank You!</h4>
                        <p className="text-gray-400 text-sm">Your feedback helps us improve.</p>
                    </div>
                )}
            </div>
        </div>
    );
}