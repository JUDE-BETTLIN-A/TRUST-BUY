"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SummaryPage() {
    const router = useRouter();

    return (
        <div className="flex-1 w-full max-w-[1240px] mx-auto px-4 md:px-6 py-8 flex flex-col">
            {/* Header / Nav */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <Link href="/home" className="text-gray-500 hover:text-primary transition-colors">Home</Link>
                <span className="text-gray-400">/</span>
                <Link href="/product/1" className="text-gray-500 hover:text-primary transition-colors">Sony WH-1000XM5</Link>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-gray-900 dark:text-white">Summary Analysis</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Product Insights</h1>

            {/* Top Stats Row including Purchase Count */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-primary text-3xl mb-2">shopping_bag</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">12,405</span>
                    <span className="text-xs text-gray-500">People bought this</span>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-green-500 text-3xl mb-2">trending_down</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">15% Drop</span>
                    <span className="text-xs text-gray-500">Expected in Nov</span>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-blue-500 text-3xl mb-2">thumb_up</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">92%</span>
                    <span className="text-xs text-gray-500">Satisfaction Rate</span>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-orange-500 text-3xl mb-2">award_star</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">#1 Best Seller</span>
                    <span className="text-xs text-gray-500">In Headphones</span>
                </div>
            </div>

            {/* Price History Graph Section */}
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Price History (30 Days)</h3>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded cursor-pointer">30 Days</span>
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-pointer hover:bg-gray-200 hover:text-gray-700 transition-colors">6 Months</span>
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-pointer hover:bg-gray-200 hover:text-gray-700 transition-colors">1 Year</span>
                    </div>
                </div>

                {/* Visual Graph using CSS Grid/Flex for bars or SVG */}
                <div className="relative h-64 w-full">
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400">
                        <span>$400</span>
                        <span>$380</span>
                        <span>$360</span>
                        <span>$340</span>
                        <span>$320</span>
                    </div>

                    {/* Chart Area */}
                    <div className="ml-12 h-full flex items-end justify-between gap-1 pl-4 pb-6 border-l border-b border-gray-200 dark:border-gray-700">
                        {/* Mock Bars */}
                        {[398, 398, 380, 375, 360, 360, 348, 348, 350, 355, 350, 348, 348, 345, 340, 340, 335, 330, 329, 335, 348, 348, 348, 348, 348, 348, 348, 348, 348, 348].map((price, i) => {
                            const heightPercentage = Math.max(((price - 300) / 100) * 100, 5); // rough scale
                            return (
                                <div key={i} className="flex-1 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors rounded-t-sm relative group flex items-end">
                                    <div className="w-full bg-primary/60 dark:bg-primary/50 group-hover:bg-primary rounded-t-sm transition-all relative" style={{ height: `${heightPercentage}%` }}>
                                        {/* Dot on top */}
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100"></div>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 shadow-lg">
                                        ${price}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* X-Axis Mock Labels */}
                    <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-400 pt-2 px-4">
                        <span>Sept 10</span>
                        <span>Sept 18</span>
                        <span>Sept 25</span>
                        <span>Oct 2</span>
                        <span>Today</span>
                    </div>
                </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Left Column (Trust Score & Alert) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Seller Trust Score */}
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">Seller Trust Score</h3>
                            <span className="material-symbols-outlined text-primary">verified_user</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-5xl font-extrabold text-primary-dark dark:text-primary">92</span>
                            <span className="text-gray-400 font-medium">/100</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <div className="bg-primary rounded text-white p-0.5"><span className="material-symbols-outlined text-[14px]">check</span></div>
                                98% Positive Seller Feedback
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <div className="bg-primary rounded text-white p-0.5"><span className="material-symbols-outlined text-[14px]">check</span></div>
                                30-Day Free Returns
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <div className="bg-primary rounded text-white p-0.5"><span className="material-symbols-outlined text-[14px]">check</span></div>
                                Authorized Dealer
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
                                <div className="border border-gray-300 rounded p-0.5 w-5 h-5"></div>
                                Price Match Guarantee
                            </div>
                        </div>
                    </div>

                    {/* Pricing Alert */}
                    <div className="bg-[#FFF8F3] dark:bg-orange-900/10 border border-[#F5E6DA] dark:border-orange-900/30 rounded-xl p-5 flex gap-4">
                        <span className="material-symbols-outlined text-orange-500 mt-1">warning</span>
                        <div>
                            <h4 className="text-[#9C4221] dark:text-orange-400 font-bold text-sm uppercase tracking-wide mb-1">Pricing Alert</h4>
                            <p className="text-[#5D4037] dark:text-orange-200/80 text-sm leading-relaxed">
                                Price historically drops by ~15% in November. Current trend suggests waiting 2 weeks might save you $40.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column (AI Review) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* AI Review Summary */}
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">AI-Lite Review Summary</h3>
                            </div>
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Generated from 450+ Reviews</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                            Users consistently praise the <span className="font-semibold text-primary-dark dark:text-primary">noise cancellation</span> and lightweight comfort of the XM5s, often citing them as the best in class for commuters. However, a recurring point of contention is the new <span className="font-semibold text-orange-600 dark:text-orange-400">non-foldable design</span> which makes them less portable than the previous XM4 model.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400 mb-3 text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined text-[18px]">thumb_up</span> Pros
                                </h4>
                                <ul className="space-y-2">
                                    {['Industry-leading Active Noise Cancellation', 'Significantly improved microphone quality', 'Lightweight, soft-fit leather styling'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="material-symbols-outlined text-green-500 text-[16px] mt-0.5">check</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-orange-700 dark:text-orange-400 mb-3 text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined text-[18px] transform rotate-180">thumb_down</span> Cons
                                </h4>
                                <ul className="space-y-2">
                                    {['Does not fold for compact travel', 'Price increase over previous XM4 generation', 'ANC cannot be fully turned off (adaptive)'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="material-symbols-outlined text-orange-500 text-[16px] mt-0.5">close</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Feature Sentiment */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Feature Sentiment</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Sound Quality', score: 4.8, color: 'bg-primary' },
                                    { label: 'Battery Life', score: 4.5, color: 'bg-primary' },
                                    { label: 'Mic Quality', score: 3.9, color: 'bg-orange-400' }
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{stat.label}</span>
                                            <span className={`font-bold ${stat.score > 4 ? 'text-primary' : 'text-orange-500'}`}>{stat.score}/5</span>
                                        </div>
                                        <div className="flex gap-1 h-2">
                                            {[1, 2, 3, 4, 5].map((bar) => (
                                                <div key={bar} className={`flex-1 rounded-full ${bar <= Math.floor(stat.score) ? stat.color : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                    {bar === 5 && stat.score % 1 !== 0 && (
                                                        <div className={`${stat.color} h-full rounded-full`} style={{ width: `${(stat.score % 1) * 100}%` }}></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Analyzed Sources */}
                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Analyzed Sources</h3>
                            <p className="text-sm text-gray-500 mb-4">Our AI aggregated opinions from these verified platforms to generate this report.</p>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {['TechRadar', 'Amazon Verified', 'Reddit r/headphones', 'YouTube Reviews'].map((source, i) => (
                                    <div key={i} className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 shadow-sm">
                                        {i === 0 && <span className="material-symbols-outlined text-[14px]">language</span>}
                                        {i === 1 && <span className="material-symbols-outlined text-[14px]">shopping_cart</span>}
                                        {i === 2 && <span className="material-symbols-outlined text-[14px]">forum</span>}
                                        {i === 3 && <span className="material-symbols-outlined text-[14px]">play_circle</span>}
                                        {source}
                                    </div>
                                ))}
                            </div>
                            <a href="#" className="flex items-center text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                                View Raw Data
                                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Reviews Section */}
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-6 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Top Reviews</h3>
                    <button className="text-sm text-primary font-medium hover:underline">View All 4,500+</button>
                </div>
                <div className="space-y-6">
                    {[
                        { user: "Sarah J.", rating: 5, date: "2 days ago", title: "Worth every penny!", content: "The noise cancellation is basically magic. I wear these on the subway every day and I can't hear a thing. Battery life is also amazing." },
                        { user: "Mike T.", rating: 4, date: "1 week ago", title: "Great sound, but bulky case", content: "Sound quality is top notch as expected from Sony. My only gripe is the carrying case is quite large since the headphones don't fold down." },
                        { user: "Alex R.", rating: 5, date: "2 weeks ago", title: "Best headphones for office work", content: "I work in a noisy open office and these are a lifesaver. The transparency mode is also really natural when I need to talk to colleagues." }
                    ].map((review, i) => (
                        <div key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-6 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {review.user.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{review.user}</span>
                                </div>
                                <span className="text-xs text-gray-400">{review.date}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, starI) => (
                                    <span key={starI} className={`material-symbols-outlined text-[16px] ${starI < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>star</span>
                                ))}
                                <span className="text-sm font-bold ml-2 text-gray-900 dark:text-white">{review.title}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {review.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center pb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Product
                </button>
            </div>
        </div>
    );
}
