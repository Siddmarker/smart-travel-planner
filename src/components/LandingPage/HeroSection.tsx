import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function HeroSection({ user }: { user: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isExploring, setIsExploring] = useState(false);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF5C69] via-[#ff8f67] to-[#FFD166]">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 text-6xl animate-bounce delay-1000 opacity-20">🗺️</div>
                <div className="absolute bottom-20 right-10 text-6xl animate-bounce delay-2000 opacity-20">🏛️</div>
                <div className="absolute top-40 right-20 text-6xl animate-bounce delay-3000 opacity-20">🍕</div>
                <div className="absolute bottom-40 left-20 text-6xl animate-bounce delay-4000 opacity-20">🏨</div>
            </div>

            <div className="container mx-auto px-4 z-10 grid md:grid-cols-2 gap-12 items-center">
                <div className="text-white space-y-6">
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                        Plan Your Perfect Trip with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD166] to-white">AI-Powered</span> Magic
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90">
                        Discover hidden gems, create personalized itineraries, and travel smarter with our intelligent trip planning platform.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-lg">
                        <div className="flex bg-white rounded-full p-2 shadow-2xl">
                            <input
                                type="text"
                                placeholder="Where do you want to go?"
                                className="flex-1 px-6 py-3 rounded-full text-gray-800 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button
                                className="rounded-full px-8 py-3 bg-gradient-to-r from-[#FF5C69] to-[#FFD166] hover:from-[#ff4b59] hover:to-[#ffc84d] text-white font-bold transition-transform hover:scale-105"
                                onClick={() => setIsExploring(true)}
                            >
                                Explore
                            </Button>
                        </div>
                        {isExploring && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl p-4 text-gray-800 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <div className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setSearchQuery('Romantic Paris getaway')}>💕 Romantic Paris getaway</div>
                                    <div className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setSearchQuery('Bali adventure trip')}>🏝️ Bali adventure trip</div>
                                    <div className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setSearchQuery('Tokyo food tour')}>🍣 Tokyo food tour</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 pt-8">
                        <div>
                            <div className="text-3xl font-bold">50K+</div>
                            <div className="text-sm opacity-80">Happy Travelers</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">120+</div>
                            <div className="text-sm opacity-80">Countries</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">95%</div>
                            <div className="text-sm opacity-80">Accuracy</div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-4 pt-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 rounded-full">
                                    🚀 Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/signup">
                                    <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 rounded-full">
                                        ✨ Start Free
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-8 rounded-full">
                                        🔐 Sign In
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Visual */}
                <div className="hidden md:block relative">
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                            <div className="h-48 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80)' }}></div>
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-xl text-gray-800">Bali Adventure</h3>
                                    <span className="text-sm text-gray-500">5 days • $1,200</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                    <span className="text-2xl">🏄‍♂️</span>
                                    <div>
                                        <div className="font-semibold text-gray-800">Surfing in Canggu</div>
                                        <div className="text-xs text-blue-600">Recommended for you</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
