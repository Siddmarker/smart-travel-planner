import React, { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PricingSection() {
    const { formatAmount } = useCurrency();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const plans = {
        monthly: {
            free: { price: 0, savings: 0 },
            pro: { price: 12, savings: 0 },
            premium: { price: 25, savings: 0 }
        },
        yearly: {
            free: { price: 0, savings: 0 },
            pro: { price: 108, savings: 36 },
            premium: { price: 225, savings: 75 }
        }
    };

    const currentPlans = plans[billingPeriod];

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-xl text-gray-600">Start free, upgrade as you grow. No hidden fees.</p>
                </div>

                {/* Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white p-1 rounded-full border shadow-sm flex items-center">
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingPeriod === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            onClick={() => setBillingPeriod('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${billingPeriod === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            onClick={() => setBillingPeriod('yearly')}
                        >
                            Yearly <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Save 25%</span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition-shadow">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2">Free</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">{formatAmount(currentPlans.free.price)}</span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            <p className="text-gray-500 mt-2">Perfect for casual travelers</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Basic trip planning</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Up to 3 day trips</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Standard recommendations</li>
                            <li className="flex items-center gap-3 opacity-50"><span className="text-gray-300">❌</span> AI-powered planning</li>
                            <li className="flex items-center gap-3 opacity-50"><span className="text-gray-300">❌</span> Multi-currency tracking</li>
                        </ul>
                        <Link href="/signup">
                            <Button variant="outline" className="w-full py-6 text-lg">Get Started Free</Button>
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-600 relative transform md:-translate-y-4">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                            Most Popular
                        </div>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">{formatAmount(currentPlans.pro.price)}</span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            {billingPeriod === 'yearly' && (
                                <div className="text-green-600 text-sm font-semibold mt-1">Save {formatAmount(currentPlans.pro.savings)}!</div>
                            )}
                            <p className="text-gray-500 mt-2">For serious travelers</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Everything in Free</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> AI-powered trip planning</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Unlimited trip duration</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Multi-currency support</li>
                        </ul>
                        <Link href="/signup?plan=pro">
                            <Button className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700">Start Pro Trial</Button>
                        </Link>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition-shadow">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2">Premium</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">{formatAmount(currentPlans.premium.price)}</span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            {billingPeriod === 'yearly' && (
                                <div className="text-green-600 text-sm font-semibold mt-1">Save {formatAmount(currentPlans.premium.savings)}!</div>
                            )}
                            <p className="text-gray-500 mt-2">For travel enthusiasts</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Everything in Pro</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Priority AI processing</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Collaborative planning</li>
                            <li className="flex items-center gap-3"><span className="text-green-500">✅</span> Premium support</li>
                        </ul>
                        <Link href="/signup?plan=premium">
                            <Button className="w-full py-6 text-lg bg-gray-900 hover:bg-gray-800">Go Premium</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
