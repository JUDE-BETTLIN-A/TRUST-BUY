"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getUserItem, setUserItem, removeUserItem, STORAGE_KEYS } from '@/lib/user-storage';

interface BasketItem {
    id: string | number;
    title: string;
    price: string;
    image: string;
    storeName: string;
    link?: string;
}

interface SavedStoryItem {
    id: number;
    title: string;
    description: string;
    date: string;
    image: string;
    color: string;
    storeName: string;
    price: string;
    savedAt: string;
}

export default function BasketPage() {
    const { data: session } = useSession();
    const userId = session?.user?.email || session?.user?.id;

    const [basket, setBasket] = useState<BasketItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load Basket (user-specific)
        const savedBasket = getUserItem(STORAGE_KEYS.BASKET, userId);
        if (savedBasket) {
            try {
                setBasket(JSON.parse(savedBasket));
            } catch (e) {
                console.error("Failed to parse basket", e);
            }
        }
    }, [userId]);

    const removeFromBasket = (indexToRemove: number) => {
        const newBasket = basket.filter((_, index) => index !== indexToRemove);
        setBasket(newBasket);
        setUserItem(STORAGE_KEYS.BASKET, JSON.stringify(newBasket), userId);
    };

    const clearBasket = () => {
        setBasket([]);
        removeUserItem(STORAGE_KEYS.BASKET, userId);
    };

    const calculateTotal = () => {
        return basket.reduce((total, item) => {
            // Clean price string (remove currency symbols, commas, etc)
            const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, ''));
            return total + (isNaN(priceNum) ? 0 : priceNum);
        }, 0);
    };

    if (!mounted) return null;

    return (
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 space-y-12">

            {/* Main Basket Section */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Basket</h1>
                        <span className="text-gray-500">{basket.length} items</span>
                    </div>

                    {basket.length === 0 ? (
                        <div className="text-center py-20 bg-surface-light dark:bg-surface-dark rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_basket</span>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your basket is empty</h2>
                            <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
                            <Link href="/search?q=Trending%20Deals" className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {basket.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex gap-4 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl relative group">
                                    <div className="size-24 shrink-0 bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-center">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 pr-8">{item.title}</h3>
                                            <button
                                                onClick={() => removeFromBasket(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Sold by: {item.storeName}</p>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="font-bold text-lg text-primary">{item.price}</span>
                                            <a
                                                href={item.link || '#'}
                                                target="_blank"
                                                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                            >
                                                View Product <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4">
                                <button onClick={clearBasket} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                    Clear Basket
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Card */}
                {basket.length > 0 && (
                    <div className="w-full md:w-80 lg:w-96 sticky top-24 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Summary</h3>

                        <div className="space-y-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{calculateTotal().toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end mb-6">
                            <span className="font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-2xl font-bold text-primary">₹{calculateTotal().toLocaleString('en-IN')}</span>
                        </div>

                        <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95">
                            Checkout
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            Transactions are processed securely.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
