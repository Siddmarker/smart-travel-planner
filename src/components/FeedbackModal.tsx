'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // Debug: Check if modal is actually mounting
    useEffect(() => {
        if (isOpen) console.log("🟢 Feedback Modal is OPEN and Ready.");
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault(); // Stop page refresh

        // VALIDATION CHECK (Manually checking so we can log errors)
        if (!message.trim()) {
            console.warn("⚠️ Message is empty. Blocking submission.");
            alert("Please enter a message!");
            return;
        }

        setSending(true);
        console.log("🚀 STARTING SUBMISSION...");
        console.log("Payload:", { message, user_email: email });

        try {
            const { data, error } = await supabase
                .from('feedback')
                .insert([
                    {
                        message: message,
                        user_email: email,
                        page_url: window.location.pathname,
                        status: 'NEW'
                    }
                ])
                .select();

            if (error) {
                console.error("❌ SUPABASE FAILED:", error);
                alert(`Error: ${error.message}`);
            } else {
                console.log("✅ SUCCESS! Data saved:", data);
                setSent(true);
                setTimeout(() => {
                    setSent(false);
                    setMessage('');
                    onClose();
                }, 2000);
            }
        } catch (err) {
            console.error("❌ CRITICAL ERROR:", err);
            alert("Something went wrong. Check console.");
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

                <h3 className="text-xl font-bold text-white mb-1">💬 Share Feedback</h3>
                <p className="text-xs text-gray-400 mb-6">Found a bug? Have an idea? Let us know.</p>

                {!sent ? (
                    <div className="space-y-4"> {/* Changed <form> to <div> to prevent validation blocking */}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email (Optional)</label>
                            <input
                                type="text"
                                placeholder="name@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Message</label>
                            <textarea
                                rows={4}
                                placeholder="Tell us what you think..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        {/* Changed Type to BUTTON and added explicit onClick */}
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={sending}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {sending ? 'Sending...' : 'Send Feedback'}
                        </button>

                    </div>
                ) : (
                    <div className="text-center py-10">
                        <div className="text-3xl mb-4">✅</div>
                        <h4 className="text-xl font-bold text-white mb-2">Thank You!</h4>
                    </div>
                )}
            </div>
        </div>
    );
}