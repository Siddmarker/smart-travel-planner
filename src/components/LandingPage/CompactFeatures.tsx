import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Map, Wallet, Users } from 'lucide-react';

export function CompactFeatures() {
    const features = [
        {
            icon: Bot,
            title: 'AI Planning',
            description: 'Smart itineraries generated in seconds based on your unique style.',
            color: 'bg-purple-500',
            gradient: 'from-purple-500/20 to-purple-500/5'
        },
        {
            icon: Map,
            title: 'Local Secrets',
            description: 'Discover hidden gems and authentic experiences away from the crowds.',
            color: 'bg-cyan-500',
            gradient: 'from-cyan-500/20 to-cyan-500/5'
        },
        {
            icon: Wallet,
            title: 'Budget Smart',
            description: 'Maximize your experiences while staying perfectly within your budget.',
            color: 'bg-emerald-500',
            gradient: 'from-emerald-500/20 to-emerald-500/5'
        },
        {
            icon: Users,
            title: 'Group Plans',
            description: 'Collaborate with friends in real-time. Vote, comment, and plan together.',
            color: 'bg-amber-500',
            gradient: 'from-amber-500/20 to-amber-500/5'
        }
    ];

    return (
        <section className="py-24 bg-[#F2F2F7] dark:bg-black relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                    >
                        Everything you need
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-500 dark:text-gray-400"
                    >
                        Smart tools for modern travelers
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                {feature.title}
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover Gradient Effect */}
                            <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
