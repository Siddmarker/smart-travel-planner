import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function FeaturesShowcase() {
    const [currentFeature, setCurrentFeature] = useState(0);

    const features = [
        {
            icon: '🗺️',
            title: 'Smart Discovery',
            description: 'Find hidden gems and local favorites with our advanced filtering and community-driven insights.',
            benefits: ['Local insights', 'Advanced filters', 'Real reviews'],
            color: '#10B981'
        },
        {
            icon: '🎯',
            title: 'Personalized Recommendations',
            description: 'Get tailored suggestions for places to visit based on your interests and style.',
            benefits: ['Curated lists', 'Interest matching', 'Context aware'],
            color: '#3B82F6'
        }
    ];

    const current = features[currentFeature];

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Why Travelers Love Our Platform</h2>
                    <p className="text-xl text-gray-600">Everything you need to plan the perfect trip, all in one place</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Visual Demo */}
                    <div className="relative">
                        <div
                            className="bg-white p-8 rounded-3xl shadow-xl border-4 transition-colors duration-500"
                            style={{ borderColor: current.color }}
                        >
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4" style={{ color: current.color }}>
                                    {current.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{current.title}</h3>
                                <p className="text-gray-600 mb-6">{current.description}</p>
                                <div className="space-y-3 text-left bg-gray-50 p-6 rounded-xl">
                                    {current.benefits.map((benefit, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <span className="text-green-500">✅</span>
                                            <span className="font-medium">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`p-6 rounded-xl cursor-pointer transition-all duration-300 flex items-start gap-4 ${index === currentFeature
                                    ? 'bg-white shadow-lg scale-105'
                                    : 'hover:bg-white hover:shadow-md'
                                    }`}
                                onClick={() => setCurrentFeature(index)}
                                style={{
                                    borderLeft: index === currentFeature ? `4px solid ${feature.color}` : '4px solid transparent'
                                }}
                            >
                                <div className="text-3xl">{feature.icon}</div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">{feature.title}</h4>
                                    <p className="text-gray-600 text-sm">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
