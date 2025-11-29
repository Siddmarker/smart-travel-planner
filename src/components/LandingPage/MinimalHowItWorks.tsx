import React from 'react';
import './GenZLanding.css';

export function MinimalHowItWorks() {
    const steps = [
        {
            step: '1',
            title: 'Tell us your vibe',
            description: 'What kind of traveler are you?',
            emoji: '🎯'
        },
        {
            step: '2',
            title: 'AI does the work',
            description: 'We craft your perfect itinerary',
            emoji: '🤖'
        },
        {
            step: '3',
            title: 'Customize & go',
            description: 'Tweak it until it feels right',
            emoji: '✈️'
        }
    ];

    return (
        <section className="minimal-how-it-works">
            <div className="steps-container">
                <div className="section-header-minimal">
                    <h2>How it works</h2>
                    <p>Simple AF</p>
                </div>

                <div className="steps-minimal">
                    {steps.map((step, index) => (
                        <div key={index} className="step-minimal">
                            <div className="step-number">{step.step}</div>
                            <div className="step-emoji">{step.emoji}</div>
                            <div className="step-content">
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="step-connector"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
