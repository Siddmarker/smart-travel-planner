import React, { useState } from 'react';

export function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            step: 1,
            title: "Tell Us Your Preferences",
            description: "Share your travel style, budget, interests, and dietary preferences",
            icon: "🎯",
            action: "Try our preference quiz →",
            demo: (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h4 className="font-bold mb-4">What's your travel style?</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg text-center hover:bg-blue-50 cursor-pointer">🏛️ Culture</div>
                        <div className="p-3 border rounded-lg text-center bg-blue-50 border-blue-500 cursor-pointer">🏖️ Relax</div>
                        <div className="p-3 border rounded-lg text-center hover:bg-blue-50 cursor-pointer">🥾 Nature</div>
                        <div className="p-3 border rounded-lg text-center hover:bg-blue-50 cursor-pointer">🍕 Food</div>
                    </div>
                </div>
            )
        },
        {
            step: 2,
            title: "AI Generates Your Plan",
            description: "Our AI creates a personalized itinerary with activities, food, and accommodations",
            icon: "🤖",
            action: "See sample itinerary →",
            demo: (
                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                        <span>09:00 AM</span>
                        <span className="font-medium">Breakfast at Local Café</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span>10:30 AM</span>
                        <span className="font-medium">City Walking Tour</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <span>01:00 PM</span>
                        <span className="font-medium">Lunch at Hidden Gem</span>
                    </div>
                </div>
            )
        },
        {
            step: 3,
            title: "Collaborate & Refine",
            description: "Invite travel companions to vote on activities and customize your plan",
            icon: "👥",
            action: "View collaboration features →",
            demo: (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex -space-x-2 mb-4 justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">A</div>
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">B</div>
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">C</div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                        3 people voting on "Sunset Cruise"
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">👍 Yes (2)</button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">👎 No (1)</button>
                    </div>
                </div>
            )
        },
        {
            step: 4,
            title: "Travel & Track",
            description: "Use your mobile itinerary, track expenses, and discover local gems on the go",
            icon: "✈️",
            action: "Download mobile app →",
            demo: (
                <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="font-bold mb-1">Trip to Bali</div>
                    <div className="text-sm text-gray-500 mb-4">Day 3 of 5</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Budget: $450 / $800</div>
                </div>
            )
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">How It Works in 4 Simple Steps</h2>
                    <p className="text-xl text-gray-600">From dream to reality - we make trip planning effortless</p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 relative">
                        {/* Progress Line */}
                        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 -z-10 hidden md:block"></div>

                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`flex gap-6 cursor-pointer group ${index === activeStep ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                                onClick={() => setActiveStep(index)}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 ${index === activeStep ? 'bg-blue-600 text-white shadow-lg scale-110' :
                                        index < activeStep ? 'bg-green-500 text-white' : 'bg-gray-100'
                                    }`}>
                                    {index < activeStep ? '✅' : step.icon}
                                </div>
                                <div className="pt-2">
                                    <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                                    <p className="text-gray-600 mb-3">{step.description}</p>
                                    {index === activeStep && (
                                        <button className="text-blue-600 font-semibold text-sm hover:underline">
                                            {step.action}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200 min-h-[400px] flex items-center justify-center">
                            {steps[activeStep].demo}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
