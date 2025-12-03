import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Plane } from 'lucide-react';

export function CompactHowItWorks() {
    const steps = [
        {
            icon: MessageSquare,
            title: 'Tell us your style',
            description: 'Quick chat or quiz about your travel preferences.',
            color: 'bg-blue-500',
            delay: 0
        },
        {
            icon: Sparkles,
            title: 'AI creates your plan',
            description: 'We generate a personalized itinerary in seconds.',
            color: 'bg-purple-500',
            delay: 0.2
        },
        {
            icon: Plane,
            title: 'Travel & enjoy',
            description: 'Everything booked and ready. Just go explore.',
            color: 'bg-pink-500',
            delay: 0.4
        }
    ];

    return (
        <section className="py-24 bg-[#F2F2F7] dark:bg-black relative">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                    >
                        Simple planning
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-500 dark:text-gray-400"
                    >
                        Three steps to your perfect trip
                    </motion.p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: step.delay }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            <div className={`w-24 h-24 rounded-3xl ${step.color} flex items-center justify-center text-white shadow-xl mb-8 relative z-10 group-hover:scale-110 transition-transform duration-300 ring-8 ring-[#F2F2F7] dark:ring-black`}>
                                <step.icon className="w-10 h-10" />
                            </div>

                            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] w-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors duration-300">
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold mb-4 text-gray-600 dark:text-gray-300">
                                    {index + 1}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
