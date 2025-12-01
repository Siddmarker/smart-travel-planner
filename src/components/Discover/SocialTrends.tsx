'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Instagram, Share2, Flame } from 'lucide-react';

export function SocialTrends() {
    const trendingHashtags = ['#StreetFood', '#BestBurger', '#HiddenGem', '#SpicyChallenge'];

    const socialFeed = [
        {
            user: '@foodie_priya',
            action: 'reviewed',
            place: 'Spice Route',
            content: 'The biryani here is fire! 🔥 Best I\'ve had in ages.',
            time: '2h ago',
            likes: '1.2K'
        },
        {
            user: '@traveler_raj',
            action: 'found a gem',
            place: 'Cafe Mosaic',
            content: 'Hidden gem alert! 💎 The rooftop view is insane.',
            time: '4h ago',
            likes: '856'
        },
        {
            user: '@bangalore_eats',
            action: 'posted',
            place: 'Truffles',
            content: 'Trying the viral burger challenge! Wish me luck 🍔',
            time: '5h ago',
            likes: '2.5K'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Trending Stats */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-pink-600 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Trending This Week
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">🍔 Burger Junction</span>
                            <Badge variant="secondary" className="bg-white text-pink-600">1.2M views</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">🥘 Curry House</span>
                            <Badge variant="secondary" className="bg-white text-pink-600">#1 on Reels</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">☕ Café Mocha</span>
                            <Badge variant="secondary" className="bg-white text-pink-600">45K shares</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Live Feed */}
            <Card className="md:col-span-2 border-slate-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        What People Are Posting
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {socialFeed.map((post, i) => (
                            <div key={i} className="flex gap-3 items-start pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                    {post.user[1].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-slate-900">
                                            {post.user} <span className="text-slate-400 font-normal">{post.action}</span> <span className="text-pink-600">{post.place}</span>
                                        </p>
                                        <span className="text-xs text-slate-400">{post.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{post.content}</p>
                                    <div className="flex gap-2 mt-2">
                                        {trendingHashtags.slice(i, i + 2).map(tag => (
                                            <span key={tag} className="text-xs text-blue-500">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
