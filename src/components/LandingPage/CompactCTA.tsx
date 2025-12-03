import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface CompactCTAProps {
    user: any;
}

export function CompactCTA({ user }: CompactCTAProps) {
    return (
        <section className="py-24 bg-[#F2F2F7] dark:bg-black">
            <div className="container mx-auto px-4 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl"
                >
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px]" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-[80px]" />
                    </div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                            Ready to explore?
                        </h2>
                        <p className="text-xl text-blue-100 mb-10 leading-relaxed">
                            Join 50,000+ travelers who are planning smarter, better trips with 2wards.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            {user ? (
                                <Link href="/trips/new">
                                    <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2">
                                        Plan New Trip <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            ) : (
                                <Link href="/signup">
                                    <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2">
                                        Start Free Today <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-medium text-blue-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-300" />
                                No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-300" />
                                5-minute setup
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-300" />
                                Global coverage
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
