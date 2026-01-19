import React from 'react';

export default function HowItWorks() {
    const steps = [
        {
            id: 1,
            icon: "🎯",
            title: "Choose Your Vibe",
            desc: "Select what you love—Trekking, Food, Heritage, or Relaxing. We tailor the plan to you."
        },
        {
            id: 2,
            icon: "🤖",
            title: "Let AI Plan It",
            desc: "Our AI builds a day-by-day itinerary instantly, optimizing routes and timings for you."
        },
        {
            id: 3,
            icon: "🎒",
            title: "Pack & Go",
            desc: "Get your complete guide, map links, and local tips. Just pack your bags and start exploring."
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6 text-center">

                {/* Section Header */}
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                    How to use <span className="text-blue-600">2wards</span>?
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-16">
                    Planning a trip shouldn't be hard. We made it simple in just 3 steps.
                </p>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {steps.map((step) => (
                        <div key={step.id} className="group relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">

                            {/* Step Number Badge */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-white shadow-lg z-10">
                                {step.id}
                            </div>

                            {/* Icon */}
                            <div className="text-6xl mb-6 mt-4 transform group-hover:scale-110 transition-transform duration-300">
                                {step.icon}
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                            <p className="text-gray-500 leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}