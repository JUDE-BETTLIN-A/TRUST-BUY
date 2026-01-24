"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/mock-scraper';

interface TrendingCardProps {
    product: Product;
}

export function TrendingCard({ product }: TrendingCardProps) {
    const router = useRouter();
    const [isVisible, setIsVisible] = React.useState(true);

    if (!isVisible) return null;

    // Synthesize original price for visual 'deal' effect
    const priceNum = product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : 0;
    const originalPrice = !isNaN(priceNum) && priceNum > 0 ? `₹${(priceNum * 1.25).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : null;
    
    // Calculate discount percentage based on original price
    let discountPercent = 0;
    if (product.originalPrice) {
        const originalNum = parseFloat(product.originalPrice.replace(/[^0-9.]/g, ''));
        if (!isNaN(originalNum) && originalNum > 0) {
            discountPercent = Math.round(((originalNum - priceNum) / originalNum) * 100);
        }
    }

    return (
        <article className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
            <div className="relative pt-4 px-4 flex justify-center bg-gray-50 dark:bg-white/5 pb-4 shrink-0">

                <div className="h-40 w-full flex items-center justify-center">
                    <Image
                        alt={product.title}
                        className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300"
                        src={product.image || "https://placehold.co/200x200?text=No+Image"}
                        width={200}
                        height={160}
                    // onError handled by Next.js Image automatically showing alt text if src fails hard
                    />
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs font-bold text-primary">
                        <span className="material-symbols-outlined text-[14px]">verified_user</span>
                        Trusted
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm h-10">{product.title}</h4>
                <div className="flex items-baseline gap-2 mb-3 mt-auto">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{product.price}</span>
                    {originalPrice && <span className="text-xs text-gray-400 line-through">{originalPrice}</span>}
                    {discountPercent > 0 && (
                        <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                            -{discountPercent}%
                        </span>
                    )}
                </div>
                <button
                    onClick={() => {
                        if (product.link) {
                            window.open(product.link, '_blank');
                        } else {
                            // Fallback to search if no link available
                            router.push(`/search?q=${encodeURIComponent(product.title)}`);
                        }
                    }}
                    className="w-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white py-2 rounded-xl text-sm font-semibold group-hover:bg-primary group-hover:text-white transition-all"
                >
                    View Deal
                </button>
            </div>
        </article>
    );
}
