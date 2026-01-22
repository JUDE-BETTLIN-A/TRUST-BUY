"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductSummaryCardProps {
    title: string;
    price: string;
    image: string;
    model?: string;
    category?: string;
    storeName?: string;
    bestPrice?: boolean;
}

export function ProductSummaryCard({
    title,
    price,
    image,
    model = "N/A",
    category = "Electronics",
    storeName,
    bestPrice = false
}: ProductSummaryCardProps) {
    return (
        <div className="flex flex-col md:flex-row items-center p-6 gap-6 border-b border-gray-200 border-border-light dark:border-gray-800 dark:border-border-dark bg-gray-50 bg-background-light/50 dark:bg-[#25282e] rounded-xl mb-4">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-lg border border-gray-200 border-border-light p-2 flex-shrink-0 flex items-center justify-center relative">
                <Image
                    alt={title}
                    className="w-full h-auto object-contain max-h-full mix-blend-multiply dark:mix-blend-normal"
                    src={image}
                    width={128}
                    height={128}
                />
                {storeName && (
                    <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {storeName}
                    </span>
                )}
            </div>
            <div className="flex-1 flex flex-col justify-center w-full text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 text-text-main dark:text-white leading-tight mb-2">
                    {title}
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 text-text-secondary mb-4">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                        {category}
                    </span>
                    <span>•</span>
                    <span>Model: {model}</span>
                </div>

                {/* Price moved to left side near photo */}
                <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 text-gray-500">
                        {bestPrice ? "Current Best" : "Price"}
                    </div>
                    <div className="text-3xl font-bold text-text-main dark:text-white text-gray-900 tabular-nums">
                        {price}
                    </div>
                </div>
            </div>

            {/* Actions aligned to the right */}
            <div className="flex flex-col items-center md:items-end gap-3 shrink-0 mt-4 md:mt-0 w-full md:w-auto">
                <div className="flex flex-col gap-2 w-full md:w-36">
                    <button className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                        Buy Now
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </button>
                    <button className="w-full px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                        Add to Cart
                    </button>
                </div>
                <Link
                    href="/summary"
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mr-1"
                >
                    View Summary
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
            </div>
        </div>
    );
}
