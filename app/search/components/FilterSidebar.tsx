"use client";

import React from 'react';

export interface FilterState {
    minPrice: number;
    maxPrice: number;
    minTrustScore: number;
    sellers: string[];
    brands: string[];
}

interface FilterSidebarProps {
    onClose?: () => void;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    availableBrands: string[];
}

const SELLER_OPTIONS = ['Amazon.in', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata Cliq', 'Jiomart'];

export function FilterSidebar({ onClose, filters, setFilters, availableBrands }: FilterSidebarProps) {

    const handleClearAll = () => {
        setFilters({
            minPrice: 0,
            maxPrice: 300000,
            minTrustScore: 0,
            sellers: [],
            brands: [],
        });
    };

    const toggleSeller = (seller: string) => {
        setFilters(prev => ({
            ...prev,
            sellers: prev.sellers.includes(seller)
                ? prev.sellers.filter(s => s !== seller)
                : [...prev.sellers, seller]
        }));
    };

    const toggleBrand = (brand: string) => {
        setFilters(prev => ({
            ...prev,
            brands: prev.brands.includes(brand)
                ? prev.brands.filter(b => b !== brand)
                : [...prev.brands, brand]
        }));
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        setFilters(prev => ({
            ...prev,
            [type === 'min' ? 'minPrice' : 'maxPrice']: num
        }));
    };

    const handleTrustChange = (score: number) => {
        setFilters(prev => ({
            ...prev,
            minTrustScore: score
        }));
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-surface-dark font-sans text-gray-900 dark:text-gray-100">

            {/* Top Navigation Bar - Sticky on Mobile */}
            <div className="sticky top-0 z-30 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-500">close</span>
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h1>
                    </div>
                    <button
                        onClick={handleClearAll}
                        className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 lg:pb-8">
                {/* Price Range Section */}
                <section className="px-4 py-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Price Range</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-semibold mb-1 block uppercase">Min Price</label>
                                <div className="flex items-center bg-gray-50 dark:bg-surface-light/5 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                                    <span className="text-gray-400 text-sm mr-1">₹</span>
                                    <input
                                        className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 text-gray-900 dark:text-white font-bold"
                                        type="text"
                                        value={filters.minPrice.toLocaleString('en-IN')}
                                        onChange={(e) => handlePriceChange('min', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-semibold mb-1 block uppercase">Max Price</label>
                                <div className="flex items-center bg-gray-50 dark:bg-surface-light/5 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                                    <span className="text-gray-400 text-sm mr-1">₹</span>
                                    <input
                                        className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 text-gray-900 dark:text-white font-bold"
                                        type="text"
                                        value={filters.maxPrice.toLocaleString('en-IN')}
                                        onChange={(e) => handlePriceChange('max', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Score Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Trust Score</h3>
                    <div className="space-y-3">
                        {[9.0, 8.5, 8.0, 7.5].map((score) => (
                            <label key={`score-${score}`} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    name="trust-score"
                                    type="radio"
                                    className="text-primary focus:ring-primary h-5 w-5 bg-transparent border-gray-300 dark:border-gray-600"
                                    checked={filters.minTrustScore === score}
                                    onChange={() => handleTrustChange(score)}
                                />
                                <span className={`text-sm font-medium transition-colors ${filters.minTrustScore === score ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary'}`}>
                                    {score.toFixed(1)}+ Excellent/Very Good
                                </span>
                            </label>
                        ))}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                name="trust-score"
                                type="radio"
                                className="text-primary focus:ring-primary h-5 w-5 bg-transparent border-gray-300 dark:border-gray-600"
                                checked={filters.minTrustScore === 0}
                                onChange={() => handleTrustChange(0)}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary">All Trust Scores</span>
                        </label>
                    </div>
                </section>

                {/* Sellers Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Sellers</h3>
                    <div className="space-y-3">
                        {SELLER_OPTIONS.map((seller) => (
                            <label key={`seller-${seller}`} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary h-5 w-5 bg-transparent"
                                    checked={filters.sellers.includes(seller)}
                                    onChange={() => toggleSeller(seller)}
                                />
                                <span className={`text-sm font-medium transition-colors ${filters.sellers.includes(seller) ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary'}`}>
                                    {seller}
                                </span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Brand Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Brands</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {availableBrands.length > 0 ? availableBrands.map((brand) => (
                            <label key={`brand-${brand}`} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary h-5 w-5 bg-transparent"
                                        checked={filters.brands.includes(brand)}
                                        onChange={() => toggleBrand(brand)}
                                    />
                                    <span className={`text-sm font-medium transition-colors ${filters.brands.includes(brand) ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary'}`}>
                                        {brand}
                                    </span>
                                </div>
                            </label>
                        )) : (
                            <p className="text-xs text-gray-500 italic">No brand filters available for this search</p>
                        )}
                    </div>
                </section>
            </div>

            {/* Bottom Action Bar - Mobile Sticky */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 lg:hidden z-20">
                <button
                    onClick={onClose}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95 transform"
                >
                    Apply Filters
                </button>
            </div>

        </div>
    );
}

