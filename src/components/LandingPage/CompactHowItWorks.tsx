import React from 'react';
import './CompactLanding.css';

export function CompactHowItWorks() {
    return (
        <section className="compact-how-it-works">
            <div className="compact-container">
                <div className="compact-section-header">
                    <h2>Simple planning</h2>
                    <p>Three steps to your perfect trip</p>
                </div>

                <div className="steps-compact">
                    <div className="step-compact">
                        <div className="step-number">1</div>
                        <div className="step-content-compact">
                            <div className="step-emoji">💬</div>
                            <h3>Tell us your style</h3>
                            <p>Quick quiz about your travel preferences</p>
                        </div>
                    </div>

                    <div className="step-compact">
                        <div className="step-number">2</div>
                        <div className="step-content-compact">
                            <div className="step-emoji">🤖</div>
                            <h3>AI creates your plan</h3>
                            <p>Personalized itinerary in seconds</p>
                        </div>
                    </div>

                    <div className="step-compact">
                        <div className="step-number">3</div>
                        <div className="step-content-compact">
                            <div className="step-emoji">🎉</div>
                            <h3>Travel & enjoy</h3>
                            <p>Your perfect trip, ready to go</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
