'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PremiumHeroSectionProps {
    user: any;
}

export function PremiumHeroSection({ user }: PremiumHeroSectionProps) {
    const [currentBackground, setCurrentBackground] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExploring, setIsExploring] = useState(false);

    const backgrounds = [
        {
            image: '/assets/hero-bali.jpg',
            location: 'Bali, Indonesia',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            image: '/assets/hero-santorini.jpg',
            location: 'Santorini, Greece',
            color: 'from-blue-400 to-purple-500'
        },
        {
            image: '/assets/hero-kyoto.jpg',
            location: 'Kyoto, Japan',
            color: 'from-rose-500 to-orange-400'
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBackground(prev => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="premium-hero relative min-h-screen flex items-center overflow-hidden">
            {/* Animated Background Slideshow */}
            <div className="hero-background-slideshow absolute inset-0 z-0">
                {backgrounds.map((bg, index) => (
                    <div
                        key={index}
                        className={`hero-bg-slide absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentBackground ? 'opacity-100' : 'opacity-0'}`}
                        style={{ backgroundImage: `url(${bg.image})` }}
                    />
                ))}
                <div className={`hero-overlay absolute inset-0 bg-gradient-to-br ${backgrounds[currentBackground].color} opacity-80 transition-colors duration-1000`}></div>
            </div>

            <div className="hero-content relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Text Content */}
                <div className="hero-text-content text-white">
                    <div className="badge-premium inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        ✨ AI-Powered Travel Planning
                    </div>

                    <h1 className="hero-title text-6xl font-bold leading-tight mb-6 font-sans">
                        Discover Your Next
                        <span className="title-highlight block text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300"> Adventure</span>
                    </h1>

                    <p className="hero-subtitle text-xl opacity-90 mb-12 max-w-lg font-light leading-relaxed">
                        Let our intelligent platform craft personalized itineraries, uncover hidden gems,
                        and transform your travel dreams into unforgettable experiences.
                        <strong className="block mt-2"> Join 50,000+ travelers worldwide.</strong>
                    </p>

                    {/* Interactive Search */}
                    <div className="hero-search-widget mb-12 relative">
                        <div className="search-container-glass flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-lg transition-all focus-within:shadow-2xl focus-within:bg-white/20">
                            <div className="search-icon text-2xl p-4">🔍</div>
                            <input
                                type="text"
                                placeholder="Where would you love to explore? Try 'Parisian cafes' or 'Bali beaches'..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsExploring(true)}
                                onBlur={() => setTimeout(() => setIsExploring(false), 200)}
                                className="search-input-glass flex-1 bg-transparent border-none text-white placeholder-white/70 text-lg outline-none px-2"
                            />
                            <button
                                className="search-btn-glow bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                                onClick={() => setIsExploring(true)}
                            >
                                Start Exploring
                            </button>
                        </div>

                        <AnimatePresence>
                            {isExploring && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="search-suggestions-glass absolute top-full left-0 right-0 mt-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                                >
                                    <div className="suggestion-title text-sm font-bold mb-4 opacity-80 uppercase tracking-wider">Popular Destinations</div>
                                    <div className="suggestions-grid grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="suggestion-card flex items-center p-4 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setSearchQuery('Romantic Paris getaway')}>
                                            <div className="suggestion-emoji text-2xl mr-4">💕</div>
                                            <div className="suggestion-text">
                                                <div className="suggestion-name font-bold">Paris Romance</div>
                                                <div className="suggestion-desc text-sm opacity-80">Eiffel Tower & fine dining</div>
                                            </div>
                                        </div>
                                        <div className="suggestion-card flex items-center p-4 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setSearchQuery('Bali adventure trip')}>
                                            <div className="suggestion-emoji text-2xl mr-4">🏝️</div>
                                            <div className="suggestion-text">
                                                <div className="suggestion-name font-bold">Bali Adventure</div>
                                                <div className="suggestion-desc text-sm opacity-80">Beaches & culture</div>
                                            </div>
                                        </div>
                                        <div className="suggestion-card flex items-center p-4 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setSearchQuery('Tokyo food tour')}>
                                            <div className="suggestion-emoji text-2xl mr-4">🍣</div>
                                            <div className="suggestion-text">
                                                <div className="suggestion-name font-bold">Tokyo Food Tour</div>
                                                <div className="suggestion-desc text-sm opacity-80">Sushi & ramen adventure</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trust Metrics */}
                    <div className="trust-metrics flex gap-8 mb-12">
                        <div className="metric-item text-center">
                            <div className="metric-value text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-200">50K+</div>
                            <div className="metric-label text-sm opacity-80">Happy Travelers</div>
                        </div>
                        <div className="metric-item text-center">
                            <div className="metric-value text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-200">120+</div>
                            <div className="metric-label text-sm opacity-80">Countries Explored</div>
                        </div>
                        <div className="metric-item text-center">
                            <div className="metric-value text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-200">95%</div>
                            <div className="metric-label text-sm opacity-80">Planning Accuracy</div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hero-actions flex gap-4 mb-8">
                        {user ? (
                            <Link href="/dashboard">
                                <button className="btn-primary-glow bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg">
                                    🚀 Continue Planning
                                </button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/signup">
                                    <button className="btn-primary-glow bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg">
                                        ✨ Start Planning Free
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <button className="btn-secondary-glass bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 hover:-translate-y-1 transition-all text-lg">
                                        🔐 Sign In
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Trust Badges */}
                    <div className="trust-badges flex gap-6 text-sm opacity-90">
                        <div className="trust-badge flex items-center gap-2">
                            <div className="badge-icon">🔒</div>
                            <span>Secure & Private</span>
                        </div>
                        <div className="trust-badge flex items-center gap-2">
                            <div className="badge-icon">💰</div>
                            <span>No Credit Card Required</span>
                        </div>
                        <div className="trust-badge flex items-center gap-2">
                            <div className="badge-icon">🌍</div>
                            <span>Global Coverage</span>
                        </div>
                    </div>
                </div>

                {/* Right Visual Content */}
                <div className="hero-visual-content relative hidden lg:block">
                    <motion.div
                        className="floating-mockup"
                        animate={{ y: [-20, 20, -20] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="mockup-container bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl max-w-md mx-auto">
                            <div className="mockup-header mb-6">
                                <div className="mockup-nav flex gap-4 border-b border-white/10 pb-4">
                                    <span className="nav-item px-4 py-2 rounded-lg bg-white/20 text-white font-medium">Dashboard</span>
                                    <span className="nav-item px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors">Discover</span>
                                    <span className="nav-item px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors">Plan Trip</span>
                                </div>
                            </div>

                            <div className="mockup-body space-y-4">
                                {/* Current Trip Card */}
                                <div className="trip-card-floating bg-white/10 rounded-xl p-6 border border-white/20">
                                    <div className="trip-header flex justify-between items-center mb-4 text-white">
                                        <div className="trip-destination flex items-center">
                                            <span className="destination-emoji text-2xl mr-3">🌴</span>
                                            <span className="destination-name font-bold text-lg">Bali Adventure</span>
                                        </div>
                                        <div className="trip-meta text-sm opacity-80">
                                            <span className="trip-duration mr-3">5 days</span>
                                            <span className="trip-budget">$1,200</span>
                                        </div>
                                    </div>
                                    <div className="trip-progress">
                                        <div className="progress-bar bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
                                            <div className="progress-fill bg-gradient-to-r from-pink-400 to-purple-400 h-full w-3/4 rounded-full"></div>
                                        </div>
                                        <span className="progress-text text-xs text-white/70">75% planned</span>
                                    </div>
                                </div>

                                {/* Recommendation Card */}
                                <div className="recommendation-card-floating flex items-center gap-4 bg-white/10 rounded-xl p-4 border border-white/20">
                                    <div className="rec-icon text-3xl bg-white/20 p-3 rounded-full">🏄‍♂️</div>
                                    <div className="rec-content text-white">
                                        <div className="rec-title font-bold">Surfing in Canggu</div>
                                        <div className="rec-subtitle text-xs opacity-80">Recommended for you</div>
                                        <div className="rec-meta text-xs mt-1 opacity-70">
                                            <span className="rec-rating mr-2">⭐ 4.8</span>
                                            <span className="rec-distance">📍 2.3km away</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="quick-stats grid grid-cols-2 gap-4">
                                    <div className="stat-mini bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                        <div className="stat-value text-xl font-bold text-white">12</div>
                                        <div className="stat-label text-xs text-white/60">Places Saved</div>
                                    </div>
                                    <div className="stat-mini bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                        <div className="stat-value text-xl font-bold text-white">3</div>
                                        <div className="stat-label text-xs text-white/60">Trips Planned</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="scroll-indicator absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="scroll-text text-sm font-medium mb-2 opacity-80">Discover More</div>
                <div className="scroll-arrow text-2xl">↓</div>
            </motion.div>
        </section>
    );
}
