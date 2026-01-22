
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getHistory, HistoryItem, clearHistory } from '@/lib/history';

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const handleClear = () => {
        clearHistory();
        setHistory([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background-dark p-6">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-white dark:hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
                            Search History
                        </h1>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-red-500 hover:text-red-600 text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Clear History
                        </button>
                    )}
                </header>

                {history.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}
                                className="bg-white dark:bg-surface-dark rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-100 dark:border-gray-800"
                            >
                                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.topResultTitle || item.query}
                                            width={60}
                                            height={60}
                                            className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal"
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">search</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.topResultTitle || item.query}</h3>
                                    <p className="text-sm text-gray-500">
                                        Searched on {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {item.price && (
                                        <span className="block font-bold text-gray-900 dark:text-white">{item.price}</span>
                                    )}
                                    <span className="text-xs text-primary font-medium hover:underline">Search Again</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-gray-400">history_toggle_off</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">No history yet</h2>
                        <p className="text-gray-500 mt-2">Start searching to see your viewed products here.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                        >
                            Start Searching
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
