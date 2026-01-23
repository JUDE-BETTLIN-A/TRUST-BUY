"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { createAlert } from '@/app/alerts/actions';

interface SearchResultCardProps {
    id: number;
    title: string;
    price: string;
    originalPrice?: string;
    storeName: string;
    image: string;
    rating: number; // 0 to 10
    trustScore: string; // "Excellent", "Very Good", etc.
    shipping?: string;
    condition?: string;
    isTopChoice?: boolean;
    onAddToBasket?: () => void;
    link?: string;
    priceHistory?: { date: string, price: number }[];
    specs?: {
        ram?: string;
        storage?: string;
        display?: string;
        camera?: string;
        processor?: string;
        battery?: string;
    };
}

export function SearchResultCard({
    id,
    title,
    price,
    originalPrice,
    storeName,
    image,
    rating,
    trustScore,
    shipping = "Free Shipping",
    condition,
    isTopChoice,
    onAddToBasket,
    link,
    priceHistory,
    specs
}: SearchResultCardProps) {
    const [showGraph, setShowGraph] = React.useState(false);
    const [alertLoading, setAlertLoading] = React.useState(false);
    const [alertSuccess, setAlertSuccess] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);

    // Normalize history data for the dot visualization
    const normalizedGraphData = React.useMemo(() => {
        if (!priceHistory || priceHistory.length === 0) {
            // Fallback mock data
            return [40, 60, 45, 50, 70, 65, 55, 60, 80, 75, 60, 90, 85, 95, 100].slice(0, 15).map(h => ({
                height: h,
                price: Math.round(Number(price.replace(/[^0-9.]/g, '')) * (h / 100)),
                date: 'Past'
            }));
        }
        const prices = priceHistory.map(p => p.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;

        return priceHistory.map(p => ({
            height: 20 + ((p.price - min) / range) * 80, // Scale 20-100
            price: p.price,
            date: p.date
        }));
    }, [priceHistory, price]);

    if (!isVisible) return null;

    return (
        <article className="group bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 flex flex-col transition-all duration-300 relative overflow-hidden">

            <div className="flex flex-col md:flex-row gap-6">
                {/* Special Badge */}
                {isTopChoice && (
                    <div className="absolute top-0 left-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-10 uppercase tracking-wide">
                        Top Choice
                    </div>
                )}

                {/* Left: Image */}
                <div className="w-full md:w-56 shrink-0 flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-lg p-4 relative">
                    {condition && (
                        <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">{condition}</span>
                    )}
                    <Image
                        alt={title}
                        className="w-full h-auto object-contain max-h-40 mix-blend-multiply dark:mix-blend-normal"
                        src={image}
                        width={200}
                        height={200}
                        onError={() => setIsVisible(false)}
                    />
                </div>

                {/* Middle: Details */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-snug group-hover:text-primary transition-colors cursor-pointer">
                            {title}
                        </h3>
                    </div>

                    {specs && Object.keys(specs).length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            {specs.ram && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">memory</span>{specs.ram}</span>}
                            {specs.storage && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">sd_storage</span>{specs.storage}</span>}
                            {specs.display && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">smartphone</span>{specs.display}</span>}
                            {specs.processor && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">developer_board</span>{specs.processor}</span>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                            Highest rated option based on price, shipping speed, and seller reputation. Includes manufacturer warranty.
                        </p>
                    )}

                    {/* Trust Signal */}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-background-light dark:bg-background-dark border border-gray-100 dark:border-gray-700 pr-3 rounded-full overflow-hidden shadow-sm">
                            <div className="size-8 rounded-full trust-score-gradient flex items-center justify-center p-[2px]">
                                <div className="size-full bg-white dark:bg-surface-dark rounded-full flex items-center justify-center">
                                    <span className="text-[11px] font-extrabold text-trust-green">{rating.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Trust Score</span>
                                <span className="text-xs font-bold text-trust-green leading-none">{trustScore}</span>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">verified</span> {storeName}
                        </span>
                    </div>

                    {/* Graph Toggle */}
                    <div className="mt-3">
                        <button
                            onClick={() => setShowGraph(!showGraph)}
                            className="text-xs font-semibold text-primary flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">{showGraph ? "expand_less" : "ssid_chart"}</span>
                            {showGraph ? "Hide Price Meter" : "Show Price Analysis"}
                        </button>
                    </div>
                </div>


                {/* Right: Pricing & Action */}
                <div className="w-full md:w-48 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border-light dark:border-border-dark pt-4 md:pt-0 md:pl-6">
                    <div>
                        <div className="flex flex-col items-end text-right">
                            {originalPrice && <span className="text-xs text-gray-500 line-through">{originalPrice}</span>}
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{price}</span>
                            </div>
                            <span className="text-[11px] text-green-600 font-medium mt-1">{shipping}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 md:mt-0">
                        <Link
                            href={`/product/${id}?title=${encodeURIComponent(title)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&store=${encodeURIComponent(storeName)}&link=${encodeURIComponent(link || '')}&rating=${rating}`}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2"
                        >
                            View Details
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                        <button
                            onClick={() => onAddToBasket && onAddToBasket()}
                            className="w-full bg-transparent border border-gray-300 dark:border-gray-600 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">shopping_basket</span>
                            Add to Basket
                        </button>
                        <button
                            onClick={async () => {
                                setAlertLoading(true);
                                try {
                                    const res = await createAlert({ title, price, image, link });
                                    if (res && res.success) {
                                        setAlertSuccess(true);
                                        setTimeout(() => setAlertSuccess(false), 3000);
                                    } else {
                                        alert("Please sign in to set alerts.");
                                    }
                                } catch (e) {
                                    alert("Failed to set alert. Please try again.");
                                } finally {
                                    setAlertLoading(false);
                                }
                            }}
                            className={`w-full border font-semibold py-2 px-4 rounded transition-all text-sm flex items-center justify-center gap-2 ${alertSuccess
                                ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                : "bg-transparent border-gray-300 dark:border-gray-600 hover:border-amber-500 hover:text-amber-500 text-gray-700 dark:text-gray-300"
                                }`}
                            disabled={alertLoading}
                        >
                            <span className="material-symbols-outlined text-sm">
                                {alertSuccess ? "check_circle" : "notifications"}
                            </span>
                            {alertLoading ? "Setting..." : alertSuccess ? "Alert Set" : "Set Price Alert"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Health Meter Section (New UI) */}
            {showGraph && (
                <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 animate-in zoom-in-95 duration-300 origin-top">
                    {(() => {
                        const prices = priceHistory?.map(p => p.price) || [0];
                        const cleanPrices = prices.filter(p => !isNaN(p) && p > 0);
                        const min = cleanPrices.length ? Math.min(...cleanPrices) : 0;
                        const max = cleanPrices.length ? Math.max(...cleanPrices) : 100;
                        const current = Number(price.replace(/[^0-9.]/g, '')) || 0;

                        const range = max - min || 1;
                        const rawPercent = ((current - min) / range) * 100;
                        const percent = Math.min(100, Math.max(0, rawPercent));

                        let verdict = "Fair Price";
                        let verdictColor = "text-amber-500";
                        if (percent < 25) { verdict = "Great Deal"; verdictColor = "text-emerald-500"; }
                        else if (percent > 75) { verdict = "High Price"; verdictColor = "text-rose-500"; }

                        return (
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price Health</div>
                                        <div className={`text-xl font-black ${verdictColor} tracking-tight`}>
                                            {verdict}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400 mb-0.5">6-Month Range</div>
                                        <div className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
                                            ₹{min.toLocaleString()} — ₹{max.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Meter Range */}
                                <div className="relative mb-8">
                                    <div className="h-3 w-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 rounded-full shadow-inner opacity-80"></div>

                                    {/* Thumb */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-900 dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-700 ease-out z-10"
                                        style={{ left: `${percent}%` }}
                                    >
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap shadow-xl">
                                            Now: ₹{current.toLocaleString()}
                                        </div>
                                        {/* Little diamond pointer */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-white"></div>
                                    </div>
                                </div>

                                {/* History Pulse */}
                                <div className="flex justify-between items-center relative px-1">
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 dark:bg-gray-700 -z-10"></div>

                                    {normalizedGraphData.map((d, i) => {
                                        let dotColor = "bg-gray-300 dark:bg-gray-600";
                                        if (d.height < 30) dotColor = "bg-emerald-400";
                                        else if (d.height > 70) dotColor = "bg-rose-400";
                                        else dotColor = "bg-amber-400";

                                        const size = i === normalizedGraphData.length - 1 ? "w-4 h-4 ring-2 ring-primary ring-offset-2" : "w-2.5 h-2.5";
                                        const isLast = i === normalizedGraphData.length - 1;

                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                                                <div className={`rounded-full ${dotColor} ${size} shadow-sm transition-transform hover:scale-150`}>
                                                </div>
                                                {/* Tooltip on Hover */}
                                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap transition-opacity z-20">
                                                    ₹{d.price.toLocaleString()}
                                                </div>

                                                {(i === 0 || isLast) && (
                                                    <span className="text-[9px] font-bold text-gray-400 absolute top-6 whitespace-nowrap">
                                                        {i === 0 ? "6mo ago" : "Today"}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </article >
    );
}
