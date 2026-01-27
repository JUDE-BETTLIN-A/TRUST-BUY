"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { createAlert } from '@/app/alerts/actions';
import { cleanProductUrl } from '@/lib/url-utils';

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
    const [alertLoading, setAlertLoading] = React.useState(false);
    const [alertSuccess, setAlertSuccess] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);

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
                        src={image || "https://placehold.co/200x200?text=No+Image"}
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

                    {/* Price Analysis Link */}
                    <div className="mt-3">
                        <Link
                            href={`/analysis?name=${encodeURIComponent(title)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&url=${encodeURIComponent(cleanProductUrl(link))}&source=${encodeURIComponent(storeName)}`}
                            className="text-xs font-semibold text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">ssid_chart</span>
                            Show Price Analysis
                        </Link>
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
                            href={`/product/${id}?title=${encodeURIComponent(title)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&store=${encodeURIComponent(storeName)}&link=${encodeURIComponent(link || '')}&rating=${rating}&originalPrice=${encodeURIComponent(originalPrice || '')}`}
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
        </article>
    );
}
