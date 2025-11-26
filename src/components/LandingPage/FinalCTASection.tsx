'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface FinalCTASectionProps {
    user: any;
}

export function FinalCTASection({ user }: FinalCTASectionProps) {
    return (
        <section className="final-cta-section py-32 bg-gradient-to-br from-slate-50 to-slate-200 relative overflow-hidden">
            <div className="cta-container max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="cta-content">
                    <div className="cta-badge inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
                        Ready to Explore?
                    </div>

                    <h2 className="cta-title text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Start Your Next Adventure Today
                    </h2>

                    <p className="cta-description text-xl text-gray-600 mb-8 leading-relaxed">
                        Join thousands of travelers who trust our platform to create unforgettable experiences.
                        From hidden local gems to iconic landmarks, we've got your perfect trip covered.
                    </p>

                    <div className="cta-features flex flex-wrap gap-3 mb-10">
                        <div className="feature-pill bg-white px-6 py-3 rounded-full font-medium shadow-sm border border-gray-200 text-gray-700">🤖 AI-Powered Planning</div>
                        <div className="feature-pill bg-white px-6 py-3 rounded-full font-medium shadow-sm border border-gray-200 text-gray-700">🌍 Global Coverage</div>
                        <div className="feature-pill bg-white px-6 py-3 rounded-full font-medium shadow-sm border border-gray-200 text-gray-700">💰 Smart Budgeting</div>
                        <div className="feature-pill bg-white px-6 py-3 rounded-full font-medium shadow-sm border border-gray-200 text-gray-700">👥 Collaboration</div>
                    </div>

                    <div className="cta-actions flex gap-4 mb-10">
                        {user ? (
                            <Link href="/trips/new">
                                <button className="cta-btn-primary bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                                    🗺️ Plan New Trip
                                </button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/signup">
                                    <button className="cta-btn-primary bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                                        ✨ Start Free Today
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <button className="cta-btn-secondary bg-white text-gray-900 border-2 border-gray-200 px-10 py-4 rounded-xl font-bold text-lg hover:border-gray-900 hover:-translate-y-1 transition-all">
                                        🔐 Sign In
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="cta-guarantee flex gap-8 text-sm text-gray-500 font-medium">
                        <div className="guarantee-item flex items-center gap-2">
                            <span className="guarantee-icon text-lg">🎯</span>
                            <span>Personalized style</span>
                        </div>
                        <div className="guarantee-item flex items-center gap-2">
                            <span className="guarantee-icon text-lg">⚡</span>
                            <span>Fast planning</span>
                        </div>
                        <div className="guarantee-item flex items-center gap-2">
                            <span className="guarantee-icon text-lg">💫</span>
                            <span>No credit card</span>
                        </div>
                    </div>
                </div>

                <div className="cta-visual relative h-[400px] hidden lg:block">
                    <div className="floating-elements-cta relative w-full h-full">
                        <motion.div
                            className="floating-element absolute text-6xl top-[10%] left-[10%]"
                            animate={{ y: [-15, 15, -15] }}
                            transition={{ duration: 5, repeat: Infinity, delay: 0 }}
                        >🗺️</motion.div>
                        <motion.div
                            className="floating-element absolute text-6xl top-[60%] left-[80%]"
                            animate={{ y: [-15, 15, -15] }}
                            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                        >🏛️</motion.div>
                        <motion.div
                            className="floating-element absolute text-6xl top-[80%] left-[20%]"
                            animate={{ y: [-15, 15, -15] }}
                            transition={{ duration: 7, repeat: Infinity, delay: 2 }}
                        >🍕</motion.div>
                        <motion.div
                            className="floating-element absolute text-6xl top-[30%] left-[70%]"
                            animate={{ y: [-15, 15, -15] }}
                            transition={{ duration: 5.5, repeat: Infinity, delay: 3 }}
                        >🏨</motion.div>
                        <motion.div
                            className="floating-element absolute text-6xl top-[40%] left-[40%]"
                            animate={{ y: [-15, 15, -15] }}
                            transition={{ duration: 6.5, repeat: Infinity, delay: 4 }}
                        >🌅</motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
