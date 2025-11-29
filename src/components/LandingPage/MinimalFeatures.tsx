import React from 'react';
import './GenZLanding.css';

export function MinimalFeatures() {
    const features = [
        {
            emoji: '🤖',
            title: 'AI Magic',
            description: 'Smart itineraries that actually get you',
            color: '#8B5CF6'
        },
        {
            emoji: '🗺️',
            title: 'Local Secrets',
            description: 'Find spots tourists miss',
            color: '#06B6D4'
        },
        {
            emoji: '💰',
            title: 'Budget Friendly',
            description: 'Maximize experiences, minimize costs',
            color: '#10B981'
        },
        {
            emoji: '👥',
            title: 'Group Planning',
            description: 'Plan with friends, no drama',
            color: '#F59E0B'
        }
    ];

    return (
        <section className="minimal-features">
            <div className="features-container">
                <div className="section-header-minimal">
                    <h2>Why it's different</h2>
                    <p>Built for how you actually travel</p>
                </div>

                <div className="features-grid-minimal">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card-minimal">
                            <div
                                className="feature-emoji"
                                style={{ backgroundColor: `${feature.color}15` }}
                            >
                                {feature.emoji}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
