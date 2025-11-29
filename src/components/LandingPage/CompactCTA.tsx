import React from 'react';
import './CompactLanding.css';

interface CompactCTAProps {
    user: any;
}

export function CompactCTA({ user }: CompactCTAProps) {
    return (
        <section className="compact-cta">
            <div className="cta-compact-container">
                <div className="cta-content-compact">
                    <h2>Ready to explore?</h2>
                    <p>Join 50,000+ travelers planning smarter trips</p>

                    <div className="cta-buttons-compact">
                        {user ? (
                            <button className="btn-cta-compact-primary">
                                Plan New Trip
                            </button>
                        ) : (
                            <button className="btn-cta-compact-primary">
                                Start Free Today
                            </button>
                        )}
                    </div>

                    <div className="trust-badges-compact">
                        <span>🔒 No credit card required</span>
                        <span>✨ 5-minute setup</span>
                        <span>🌍 Global coverage</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
