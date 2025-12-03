import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './CompactLanding.css';

interface CompactHeroProps {
    user: any;
}

export function CompactHero({ user }: CompactHeroProps) {
    const [activeDestination, setActiveDestination] = useState(0);

    const destinations = [
        { name: 'Bali', emoji: '🏝️', color: '#FF5C69' },
        { name: 'Tokyo', emoji: '🗼', color: '#FFD166' },
        { name: 'Paris', emoji: '🥐', color: '#FF8F67' },
        { name: 'Barcelona', emoji: '🏰', color: '#F59E0B' }
    ];

    return (
        <section className="compact-hero">
            {/* Subtle Gradient Background */}
            <div className="hero-bg-aesthetic">
                <div className="gradient-blob blob-1"></div>
                <div className="gradient-blob blob-2"></div>
                <div className="gradient-blob blob-3"></div>
            </div>

            <div className="compact-hero-container">
                {/* Left Content - Tight Layout */}
                <div className="compact-hero-content">
                    <div className="mb-8 relative h-12 w-40">
                        <Image
                            src="/logo.png"
                            alt="2wards Logo"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>

                    <h1 className="compact-title">
                        Plan your perfect trip to{' '}
                        <span
                            className="destination-highlight"
                            style={{ color: destinations[activeDestination].color }}
                        >
                            {destinations[activeDestination].emoji} {destinations[activeDestination].name}
                        </span>
                    </h1>

                    <p className="compact-subtitle">
                        Smart itineraries, local secrets, and budget hacks.
                        Used by 50K+ travelers who actually enjoy planning.
                    </p>

                    {/* Compact Search */}
                    <div className="compact-search">
                        <div className="search-wrapper">
                            <input
                                type="text"
                                placeholder="Where to next?"
                                className="compact-search-input"
                            />
                            <button className="compact-search-btn">
                                Explore →
                            </button>
                        </div>
                    </div>

                    {/* Tight Stats Grid */}
                    <div className="compact-stats">
                        <div className="compact-stat">
                            <div className="stat-number">50K+</div>
                            <div className="stat-label">Travelers</div>
                        </div>
                        <div className="compact-stat">
                            <div className="stat-number">120+</div>
                            <div className="stat-label">Countries</div>
                        </div>
                        <div className="compact-stat">
                            <div className="stat-number">95%</div>
                            <div className="stat-label">Love It</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="compact-actions">
                        {user ? (
                            <Link href="/dashboard">
                                <button className="btn-compact-primary">
                                    Continue Planning
                                </button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/signup">
                                    <button className="btn-compact-primary">
                                        Start Free
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <button className="btn-compact-secondary">
                                        Sign In
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Visual - Compact */}
                <div className="compact-hero-visual">
                    <div className="visual-card">
                        <div className="card-header">
                            <div className="destination-pills">
                                {destinations.map((dest, index) => (
                                    <button
                                        key={index}
                                        className={`destination-pill ${index === activeDestination ? 'active' : ''}`}
                                        onClick={() => setActiveDestination(index)}
                                        style={index === activeDestination ? {
                                            backgroundColor: dest.color,
                                            borderColor: dest.color,
                                            color: 'white'
                                        } : {}}
                                    >
                                        {dest.emoji} {dest.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="card-content">
                            {/* Current Trip */}
                            <div className="trip-preview">
                                <div className="trip-header">
                                    <div className="trip-emoji">{destinations[activeDestination].emoji}</div>
                                    <div className="trip-details">
                                        <div className="trip-name">{destinations[activeDestination].name} Adventure</div>
                                        <div className="trip-meta">4 days • $980</div>
                                    </div>
                                </div>
                                <div className="trip-progress">
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: '65%',
                                                backgroundColor: destinations[activeDestination].color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className="recommendation-preview">
                                <div className="rec-emoji">🍜</div>
                                <div className="rec-content">
                                    <div className="rec-title">Local Food Tour</div>
                                    <div className="rec-meta">⭐ 4.8 • 📍 1.2km</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
