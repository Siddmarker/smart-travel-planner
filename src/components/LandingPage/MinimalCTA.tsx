import React from 'react';
import './GenZLanding.css';

interface MinimalCTAProps {
    user: any;
}

export function MinimalCTA({ user }: MinimalCTAProps) {
    return (
        <section className="minimal-cta">
            <div className="cta-container-minimal">
                <div className="cta-content-minimal">
                    <h2>Ready to explore?</h2>
                    <p>Your next adventure is a click away. No credit card needed.</p>

                    <div className="cta-buttons-minimal">
                        {user ? (
                            <button className="btn-cta-primary">
                                Plan New Trip →
                            </button>
                        ) : (
                            <>
                                <button className="btn-cta-primary">
                                    Start Free Today
                                </button>
                                <button className="btn-cta-secondary">
                                    Sign In
                                </button>
                            </>
                        )}
                    </div>

                    <div className="cta-features-minimal">
                        <span>✨ AI Planning</span>
                        <span>🌍 Global Coverage</span>
                        <span>💰 Budget Tracking</span>
                        <span>👥 Group Features</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
