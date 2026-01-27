"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { extractSpecs, ProductSpecs } from '@/lib/specs-extractor';
import { fetchRealSpecs } from './actions';
import { cleanProductUrl, cleanProductTitle } from '@/lib/url-utils';

function ProductSpecContent() {
    const searchParams = useSearchParams();

    // Basic Info from URL
    const title = searchParams.get('title') || "Product Name";
    const price = searchParams.get('price') || "₹0";
    const image = searchParams.get('image') || "";
    const storeName = searchParams.get('store') || "Store";
    const link = searchParams.get('link') || "#";
    const rating = parseFloat(searchParams.get('rating') || "4.5");
    const originalPrice = searchParams.get('originalPrice');

    // Unified Specs State
    const [specs, setSpecs] = useState<ProductSpecs | null>(null);
    const [realSpecsList, setRealSpecsList] = useState<string[]>([]);
    const [specsLoading, setSpecsLoading] = useState(true);
    const [specsSource, setSpecsSource] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (title) {
            // 1. Instant: Extract basics from title for immediate UI (Hero section)
            const extracted = extractSpecs(title);
            setSpecs(extracted);

            // 2. Async: Fetch REAL specs from the web via Server Action
            fetchRealSpecs(title).then(result => {
                if (result.specs && result.specs.length > 0) {
                    setRealSpecsList(result.specs);
                    setSpecsSource(result.source);

                    // Sync Key Specs Grid with Real Data (so icons match the detailed list)
                    const newSpecs: Partial<ProductSpecs> = {};
                    result.specs.forEach(s => {
                        const parts = s.split(':');
                        if (parts.length >= 2) {
                            const key = parts[0].trim().toLowerCase();
                            const val = parts.slice(1).join(':').trim();

                            if (key.includes('ram')) newSpecs.ram = val;
                            if (key.includes('storage')) newSpecs.storage = val;
                            if (key.includes('processor') || key.includes('chip') || key.includes('cpu')) newSpecs.processor = val;
                            if (key.includes('camera')) newSpecs.camera = val;
                            if (key.includes('battery')) newSpecs.battery = val;
                            if (key.includes('display')) newSpecs.display = val;
                        }
                    });

                    if (Object.keys(newSpecs).length > 0) {
                        setSpecs(prev => ({ ...prev, ...newSpecs }));
                    }
                }
                setSpecsLoading(false);
            }).catch((err) => {
                console.error(err);
                setSpecsLoading(false);
            });

            // Fallback enrichment for key fields if extraction from title failed
            // Note: We use extracted as base, but allow undefined to avoid fake data
            setSpecs(prev => ({
                ...prev,
                ram: prev?.ram || extracted.ram,
                storage: prev?.storage || extracted.storage,
                display: prev?.display || extracted.display,
                camera: prev?.camera || extracted.camera,
                processor: prev?.processor || extracted.processor,
                battery: prev?.battery || extracted.battery,
            }));
        }
    }, [title]);

    if (!title) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-20">
            {/* Breadcrumb */}
            <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    <span>/</span>
                    <Link href="/search" className="hover:text-primary">Products</Link>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white truncate max-w-xs">{title}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Image & Key Actions */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-center relative group">
                        {originalPrice && (
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                {(() => {
                                    try {
                                        const p = parseFloat(price.replace(/[^0-9.]/g, ''));
                                        const op = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
                                        if (!isNaN(p) && !isNaN(op) && op > p) {
                                            return Math.round(((op - p) / op) * 100) + "% OFF";
                                        }
                                        return "SALE";
                                    } catch (e) { return "SALE"; }
                                })()}
                            </div>
                        )}
                        <Image
                            src={image || "/placeholder.png"}
                            alt={title}
                            width={400}
                            height={400}
                            className="object-contain max-h-[400px] w-auto mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex gap-3">
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                        >
                            Go to Store
                            <span className="material-symbols-outlined">open_in_new</span>
                        </a>
                        <button className="flex-none w-14 h-14 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center hover:border-primary text-gray-400 hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20">
                            <span className="material-symbols-outlined">favorite</span>
                        </button>
                        <button className="flex-none w-14 h-14 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center hover:border-primary text-gray-400 hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20">
                            <span className="material-symbols-outlined">share</span>
                        </button>
                    </div>

                    {/* Price Analysis Button */}
                    <Link
                        href={`/analysis?name=${encodeURIComponent(cleanProductTitle(title))}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&url=${encodeURIComponent(link.includes('amazon') && link.includes('/dp/') ? `https://amazon.in/dp/${link.split('/dp/')[1].substring(0, 10)}` : cleanProductUrl(link))}&source=${encodeURIComponent(storeName)}`}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined">analytics</span>
                        AI Price Analysis & Prediction
                    </Link>
                </div>

                {/* Right Column: Key Infos & Specs */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    {/* Header Info */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-sm font-bold">
                                <span>{rating}</span>
                                <span className="material-symbols-outlined text-sm">star</span>
                            </div>
                            <span className="text-sm text-gray-500 underline decoration-dotted cursor-pointer">1,240 Ratings & 45 Reviews</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-green-600 font-medium">Available</span>
                            {storeName && (
                                <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-sm text-gray-500">Sold by <span className="font-semibold text-gray-900 dark:text-gray-200">{storeName}</span></span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Best Price</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
                                    {originalPrice && (
                                        <span className="text-lg text-gray-400 line-through">{originalPrice}</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">*inclusive of all taxes</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Image src="/trust-badge.png" alt="Trust" width={24} height={24} className="opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TrustBuy Verified</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Specs Grid (Quick Glance) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {specs && [
                            { icon: "memory", label: "RAM", value: specs.ram },
                            { icon: "developer_board", label: "Processor", value: specs.processor },
                            { icon: "photo_camera", label: "Camera", value: specs.camera },
                            { icon: "battery_charging_full", label: "Battery", value: specs.battery },
                        ].filter(item => item.value).map((item, i) => (
                            <div key={i} className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex flex-col items-center text-center gap-2 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* DYNAMIC REAL SPECS SECTION */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detailed Specifications</h3>
                            {specsSource && (
                                <Link href={specsSource} target="_blank" className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors px-2 py-1 rounded hidden sm:inline-block truncate max-w-[200px] flex items-center gap-1">
                                    Source: {new URL(specsSource).hostname}
                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                </Link>
                            )}
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {specsLoading ? (
                                <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                                    <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-medium">Verifying specifications from trusted sources...</p>
                                </div>
                            ) : realSpecsList.length > 0 ? (
                                <div className="p-6">
                                    <ul className="space-y-4">
                                        {realSpecsList.map((spec, idx) => {
                                            const parts = spec.split(':');
                                            const label = parts[0];
                                            const value = parts.slice(1).join(':').trim();
                                            return (
                                                <li key={idx} className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                                                    <span className="text-gray-500 text-sm font-medium">{label}</span>
                                                    <span className="text-gray-900 dark:text-white text-sm font-semibold sm:text-right mt-1 sm:mt-0">{value}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-gray-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">data_info_alert</span>
                                    <p>Specification data not available for this product.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function ProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Specs...</div>}>
            <ProductSpecContent />
        </Suspense>
    );
}
