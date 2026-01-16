'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPost() {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) setPost(data);
            setLoading(false);
        }
        if (slug) fetchPost();
    }, [slug]);

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    if (!post) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Post not found</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/blog" className="text-sm font-bold text-gray-400 hover:text-white">← Back to Logs</Link>
                </div>
            </nav>

            <div className="relative h-[60vh]">
                <img src={post.image_url} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 md:p-20 max-w-4xl">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">{post.category}</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{post.title}</h1>
                    <p className="text-xl text-gray-300">{post.excerpt}</p>
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-lg">
                {/* Simple text render. For rich text, we'd use a Markdown parser later */}
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {post.content}
                </div>
            </article>
        </div>
    );
}