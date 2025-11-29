import React, { useState, useEffect } from 'react';
import './GenZLanding.css';

interface GenZHeroSectionProps {
    user: any;
}

export function GenZHeroSection({ user }: GenZHeroSectionProps) {
    const [searchActive, setSearchActive] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [currentWord, setCurrentWord] = useState(0);

    const destinations = ['Bali', 'Tokyo', 'Paris', 'Barcelona', 'Bangkok'];

    useEffect(() => {
        const typingInterval = setInterval(() => {
            setTypedText(destinations[currentWord].slice(0, typedText.length + 1));

            if (typedText === destinations[currentWord]) {
                setTimeout(() => {
                    setTypedText('');
                    setCurrentWord((prev) => (prev + 1) % destinations.length);
                }, 1500);
            }
        }, 100);

        return () => clearInterval(typingInterval);
    }, [typedText, currentWord]);

    return (
        <section className="genz-hero">
            {/* Minimal Background */}
            <div className="hero-bg-minimal">
                <div className="floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>
            </div>

            <div className="hero-container">
                {/* Left Content - Ultra Minimal */}
                <div className="hero-content-minimal">
                    {/* Badge */}
                    <div className="minimal-badge">
                        <span>✨ AI Travel Planner</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="minimal-title">
                        Your next trip to
                        <br />
                        <span className="typing-text">{typedText}</span>
                        <span className="cursor">|</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="minimal-subtitle">
                        Plan smarter trips with AI. Discover hidden spots, save money,
                        and travel like a local. No stress, just vibes. 🎒
                    </p>

                    {/* Search - Super Minimal */}
                    <div className={`minimal-search ${searchActive ? 'active' : ''}`}>
                        <div className="search-icon">✈️</div>
                        <input
                            type="text"
                            placeholder="Where to next?"
                            onFocus={() => setSearchActive(true)}
                            onBlur={() => setSearchActive(false)}
                            className="search-input-minimal"
                        />
                        <button className="search-btn-minimal">
                            Explore
                        </button>
                    </div>

                    {/* Stats - Clean & Minimal */}
                    <div className="minimal-stats">
                        <div className="stat-item">
                            <div className="stat-number">50K+</div>
                            <div className="stat-label">Travelers</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">120+</div>
                            <div className="stat-label">Countries</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">95%</div>
                            <div className="stat-label">Happy</div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="minimal-actions">
                        {user ? (
                            <button className="cta-minimal-primary">
                                🗺️ Continue Planning
                            </button>
                        ) : (
                            <>
                                <button className="cta-minimal-primary">
                                    Start Free →
                                </button>
                                <button className="cta-minimal-secondary">
                                    I have an account
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Visual - Clean Mockup */}
                <div className="hero-visual-minimal">
                    <div className="phone-mockup">
                        <div className="phone-header">
                            <div className="camera"></div>
                        </div>

                        <div className="phone-content">
                            {/* Current Trip */}
                            <div className="trip-minimal">
                                <div className="trip-header-minimal">
                                    <span className="trip-emoji">🌴</span>
                                    <div className="trip-info">
                                        <div className="trip-name">Bali Trip</div>
                                        <div className="trip-meta">5 days • $1,200</div>
                                    </div>
                                </div>
                                <div className="progress-minimal">
                                    <div className="progress-bar-minimal">
                                        <div className="progress-fill-minimal" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className="rec-minimal">
                                <div className="rec-icon">🏄‍♂️</div>
                                <div className="rec-details">
                                    <div className="rec-title">Surfing in Canggu</div>
                                    <div className="rec-subtitle">⭐ 4.8 • 📍 2.3km</div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="quick-actions-minimal">
                                <button className="action-btn">💾 Save</button>
                                <button className="action-btn">📅 Plan</button>
                                <button className="action-btn">👥 Share</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="scroll-minimal">
                <span>Scroll to explore</span>
                <div className="scroll-arrow-minimal">↓</div>
            </div>
        </section>
    );
}
