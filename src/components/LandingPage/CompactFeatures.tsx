import React from 'react';


export function CompactFeatures() {
    const features = [
        {
            emoji: '🤖',
            title: 'AI Planning',
            description: 'Smart itineraries in seconds',
            color: '#8B5CF6',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            emoji: '🗺️',
            title: 'Local Secrets',
            description: 'Find hidden gems',
            color: '#06B6D4',
            gradient: 'from-cyan-500 to-blue-500'
        },
        {
            emoji: '💰',
            title: 'Budget Smart',
            description: 'Maximize experiences',
            color: '#10B981',
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            emoji: '👥',
            title: 'Group Plans',
            description: 'Plan with friends',
            color: '#F59E0B',
            gradient: 'from-amber-500 to-orange-500'
        }
    ];

    return (
        <section className="compact-features">
            <div className="features-container">
                <div className="compact-section-header">
                    <h2>Everything you need</h2>
                    <p>Smart tools for modern travelers</p>
                </div>

                <div className="compact-features-grid">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-compact-card"
                            style={{
                                borderLeft: `4px solid ${feature.color}20`,
                                backgroundColor: `${feature.color}08`
                            }}
                        >
                            <div
                                className="feature-icon-compact"
                                style={{ backgroundColor: feature.color }}
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
