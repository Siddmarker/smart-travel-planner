import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Star, Users, Globe, Heart } from 'lucide-react';

interface CompactHeroProps {
    user: any;
}

export function CompactHero({ user }: CompactHeroProps) {
    const [activeDestination, setActiveDestination] = useState(0);

    const destinations = [
        {
            name: 'Bali',
            emoji: '🏝️',
            color: 'from-rose-400 to-orange-300',
            bg: 'bg-rose-50',
            image: '/destinations/bali.jpg', // Placeholder
            price: '$980',
            days: 4
        },
        {
            name: 'Tokyo',
            emoji: '🗼',
            color: 'from-blue-400 to-purple-400',
            bg: 'bg-blue-50',
            image: '/destinations/tokyo.jpg',
            price: '$1,450',
            days: 7
        },
        {
            name: 'Paris',
            emoji: '🥐',
            color: 'from-pink-400 to-rose-400',
            bg: 'bg-pink-50',
            image: '/destinations/paris.jpg',
            price: '$1,200',
            days: 5
        },
        {
            name: 'Barcelona',
            emoji: '🏰',
            color: 'from-amber-400 to-orange-400',
            bg: 'bg-amber-50',
            image: '/destinations/barcelona.jpg',
            price: '$1,100',
            days: 6
        }
    ];

    return (
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#F2F2F7] dark:bg-black py-10">
            {/* Abstract Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[100px] mix-blend-multiply animate-pulse-slow delay-1000" />
                <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-pink-400/20 blur-[80px] mix-blend-multiply animate-pulse-slow delay-2000" />
            </div>

            <div className="container mx-auto px-4 relative z-10 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-7 flex flex-col gap-8 text-center lg:text-left"
                    >
                        {/* Logo Badge */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-sm w-fit mx-auto lg:mx-0"
                        >
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                ✨ AI-Powered Travel Planning
                            </span>
                        </motion.div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                            Plan your <br />
                            <span className="relative inline-block">
                                <span className={`bg-gradient-to-r ${destinations[activeDestination].color} bg-clip-text text-transparent transition-all duration-500`}>
                                    dream trip
                                </span>
                            </span>
                            <br /> in seconds.
                        </h1>

                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Experience the future of travel. Smart itineraries, hidden gems, and seamless booking—all in one beautiful app.
                        </p>

                        {/* Search Bar - iOS Style */}
                        <div className="relative max-w-md mx-auto lg:mx-0 w-full group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
                                <div className="pl-4 text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Where do you want to go?"
                                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                                />
                                <button className="p-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-black bg-gray-200 overflow-hidden">
                                        <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} width={40} height={40} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                <span className="text-black dark:text-white font-bold">50,000+</span> travelers
                                <br /> trust 2wards
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Visual - Bento Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="lg:col-span-5 relative"
                    >
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                            {/* Main Card */}
                            <motion.div
                                layoutId="main-card"
                                className="col-span-2 bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl border border-white/20 p-6 rounded-[2rem] shadow-2xl"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {destinations[activeDestination].name}
                                        </h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                            <Globe className="w-3 h-3" /> Popular Destination
                                        </p>
                                    </div>
                                    <span className="text-4xl">{destinations[activeDestination].emoji}</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${destinations[activeDestination].color} text-white`}>
                                                <Star className="w-5 h-5 fill-current" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">Top Rated</div>
                                                <div className="text-xs text-gray-500">4.9/5.0</div>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">{destinations[activeDestination].price}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">Travelers</div>
                                                <div className="text-xs text-gray-500">1.2k this month</div>
                                            </div>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-300 border border-white" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Secondary Cards */}
                            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl border border-white/20 p-5 rounded-[2rem] shadow-xl flex flex-col justify-center items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                                    <Heart className="w-6 h-6 fill-current" />
                                </div>
                                <div className="font-bold text-lg">For You</div>
                                <div className="text-xs text-gray-500">AI Curated</div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-5 rounded-[2rem] shadow-xl text-white flex flex-col justify-between">
                                <div className="text-xs font-medium opacity-80">PRO TIP</div>
                                <div className="font-bold leading-tight">Book early to save 20%</div>
                            </div>
                        </div>

                        {/* Floating Pills */}
                        <div className="absolute -bottom-6 -left-6 right-6 flex gap-3 overflow-x-auto pb-4 pt-8 px-4 no-scrollbar mask-linear">
                            {destinations.map((dest, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveDestination(idx)}
                                    className={`
                                        flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border
                                        ${activeDestination === idx
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-lg scale-105'
                                            : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-white/20 hover:bg-white/80'}
                                    `}
                                >
                                    {dest.emoji} {dest.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
