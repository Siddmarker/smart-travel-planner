'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BlogIndexPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. Fetch Data from Database on Load
    useEffect(() => {
        async function fetchBlogs() {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false }); // Show newest first

            if (error) console.error('Error fetching blogs:', error);
            if (data) setPosts(data);
            setLoading(false);
        }

        fetchBlogs();
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-400 rounded-lg flex items-center justify-center font-bold text-black">2</div>
                        <span className="font-black text-xl tracking-tight text-white">2wards</span>
                    </Link>
                    <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white">← Back to Home</Link>
                </div>
            </nav>

            {/* --- HEADER --- */}
            <section className="pt-40 pb-20 px-6 text-center">
                <h1 className="text-5xl md:text-7xl font-black mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">The Travel Log</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Stories, festivals, and guides for the modern explorer.
                </p>
            </section>

            {/* --- BLOG GRID --- */}
            <section className="max-w-7xl mx-auto px-6 pb-32">
                {loading ? (
                    // Loading Skeleton
                    <div className="text-center text-gray-500 animate-pulse">Loading amazing stories...</div>
                ) : posts.length === 0 ? (
                    // Empty State
                    <div className="text-center text-gray-500">No blogs found. Go add some in Supabase!</div>
                ) : (
                    // The Real Grid
                    <div className="grid md:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link href={`/blog/${post.slug}`} key={post.id} className="group block">
                                <article className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 h-full flex flex-col">

                                    {/* Image */}
                                    <div className="h-48 overflow-hidden relative">
                                        <img
                                            src={post.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        {post.category && (
                                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                                {post.category}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="text-xs text-gray-500 mb-3">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1 line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-blue-500 group-hover:gap-3 transition-all mt-auto">
                                            Read Article <span>→</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}