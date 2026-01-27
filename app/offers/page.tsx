"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createAlert } from '../alerts/actions';

interface OfferStory {
    id: number;
    title: string;
    description: string;
    date: string;
    image: string;
    color: string;
    storeName: string;
    price: string;
    viewed: boolean;
}

const STORIES_DATA: OfferStory[] = [
    {
        id: 1,
        title: "Great Republic Day Sale",
        description: "Unbeatable deals on smartphones, laptops, and more. 10% instant discount with SBI cards.",
        date: "Starts Jan 14",
        image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=800",
        color: "bg-blue-600",
        storeName: "Amazon.in",
        price: "Up to 40% Off",
        viewed: false
    },
    {
        id: 2,
        title: "Big Saving Days",
        description: "The biggest sale on electronics, fashion, and home essentials. Early access for Plus members.",
        date: "Jan 15 - 20",
        image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&q=80&w=800",
        color: "bg-blue-500",
        storeName: "Flipkart",
        price: "Min 50% Off",
        viewed: false
    },
    {
        id: 3,
        title: "Constitution of Tech Sale",
        description: "Celebrate democracy with democratic prices on premium gadgets.",
        date: "Jan 26 Special",
        image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800",
        color: "bg-teal-600",
        storeName: "Croma",
        price: "Flat ₹5000 Off",
        viewed: false
    },
    {
        id: 4,
        title: "Digital India Sale",
        description: "Widest range of electronics at the best prices. Experience the latest tech.",
        date: "Jan 22 - 26",
        image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=800",
        color: "bg-red-600",
        storeName: "Reliance Digital",
        price: "iPhone 15 @ ₹65,999",
        viewed: false
    },
    {
        id: 5,
        title: "End of Season Sale",
        description: "Premium brands, premium savings. Grab your favorites before they are gone.",
        date: "Ending Soon",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800",
        color: "bg-pink-600",
        storeName: "Tata Cliq",
        price: "Up to 80% Off",
        viewed: false
    }
];

export default function OffersPage() {
    const [stories, setStories] = useState<OfferStory[]>(STORIES_DATA);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [notification, setNotification] = useState<string | null>(null); // Notification state
    const router = useRouter();

    // Auto-advance progress bar when a story is active
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeStoryIndex !== null) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        advanceStory();
                        return 0;
                    }
                    return prev + 1; // 1% every 30ms -> ~3 seconds total
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [activeStoryIndex]);

    // Auto-open first story on mount
    useEffect(() => {
        setActiveStoryIndex(0);
    }, []);

    const advanceStory = () => {
        if (activeStoryIndex === null) return;
        if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
        } else {
            closeStory();
        }
    };

    const closeStory = () => {
        setActiveStoryIndex(null);
        setProgress(0);
        setNotification(null);
    };

    const openStory = (index: number) => {
        setActiveStoryIndex(index);
        // Mark as viewed
        const newStories = [...stories];
        newStories[index].viewed = true;
        setStories(newStories);
    };

    const handleSetAlert = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeStoryIndex === null) return;
        const story = stories[activeStoryIndex];

        try {
            // Heuristic to extract price for alert
            let priceForAlert = story.price;
            if (story.price.includes('₹')) {
                const parts = story.price.split('₹');
                if (parts.length > 1) {
                    priceForAlert = parts[1].trim(); // Trim to remove leading/trailing spaces
                }
            }

            await createAlert({
                title: story.title,
                price: priceForAlert,
                image: story.image,
                link: '#' // No specific link for stories yet
            });

            // Show notification
            setNotification(`Alert set for ${story.title}`);
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error("Failed to set alert:", error);
            setNotification("Login required to set alerts");
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

    return (
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 relative">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Exclusive Stories</h1>
                <p className="text-gray-500">Tap to view upcoming flash sales and limited time offers.</p>
            </div>

            {/* Stories Tray */}
            <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar">
                {stories.map((story, index) => (
                    <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0" onClick={() => openStory(index)}>
                        <div className={`p-[3px] rounded-full ${story.viewed ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'}`}>
                            <div className="p-[2px] bg-white dark:bg-surface-dark rounded-full">
                                <div className="w-20 h-20 rounded-full overflow-hidden relative">
                                    <Image
                                        src={story.image}
                                        alt={story.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px] text-center truncate">{story.title}</p>
                    </div>
                ))}
            </div>

            {/* Standard Grid Layout (Still visible below) */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8">All Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((offer) => (
                    <article key={offer.id} className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1">
                        <div className="h-48 relative overflow-hidden">
                            <Image
                                src={offer.image}
                                alt={offer.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4">
                                <span className={`${offer.color} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg`}>
                                    {offer.date}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{offer.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{offer.description}</p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Full Screen Story Viewer Overlay */}
            {activeStory && (
                <div className="fixed inset-0 z-[100] bg-black">
                    {/* Notification Toast */}
                    {notification && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[120] bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                            {notification}
                        </div>
                    )}

                    {/* Progress Bar Container */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                        {stories.map((_, idx) => (
                            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-white transition-all duration-100 ease-linear ${idx < (activeStoryIndex || 0) ? 'w-full' : idx === activeStoryIndex ? 'w-[var(--progress)]' : 'w-0'}`}
                                    style={idx === activeStoryIndex ? { width: `${progress}%` } : {}}
                                ></div>
                            </div>
                        ))}
                    </div>

                    {/* Header: User Info & Close */}
                    <div className="absolute top-8 left-4 right-4 z-20 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <span className="material-symbols-outlined text-sm">storefront</span>
                            </div>
                            <span className="font-semibold text-sm">{activeStory.storeName}</span>
                            <span className="text-white/60 text-xs">• {activeStory.date}</span>
                        </div>
                        <button onClick={closeStory} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    {/* Navigation Areas */}
                    <div className="absolute inset-0 flex z-10">
                        <div className="w-1/3 h-full" onClick={() => { if ((activeStoryIndex || 0) > 0) setActiveStoryIndex((activeStoryIndex || 0) - 1); }}></div>
                        <div className="w-1/3 h-full" onClick={advanceStory}></div>
                        <div className="w-1/3 h-full" onClick={advanceStory}></div>
                    </div>

                    {/* Main Content */}
                    <div className="relative h-full w-full flex flex-col justify-center items-center">
                        <div className="absolute inset-0">
                            <Image
                                src={activeStory.image}
                                alt={activeStory.title}
                                fill
                                className="object-cover opacity-60 blur-3xl scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40"></div>
                        </div>

                        <div className="relative z-20 max-w-md w-full px-6 text-center">
                            <div className="bg-white dark:bg-surface-dark p-1 rounded-2xl shadow-2xl rotate-1 mb-8">
                                <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden">
                                    <Image
                                        src={activeStory.image}
                                        alt={activeStory.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-left">
                                        <div className="inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2">
                                            {activeStory.price}
                                        </div>
                                        <h2 className="text-white text-2xl font-bold leading-tight mb-2">{activeStory.title}</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleSetAlert}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                >
                                    <span className="material-symbols-outlined">notifications_active</span>
                                    Set Alert
                                </button>
                                <p className="text-white/70 text-sm">{activeStory.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
