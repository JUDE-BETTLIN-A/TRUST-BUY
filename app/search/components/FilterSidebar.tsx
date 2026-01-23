"use client";

import React, { useMemo } from 'react';

export interface FilterState {
    minPrice: number;
    maxPrice: number;
    minTrustScore: number;
    sellers: string[];
    brands: string[];
    features: string[];
    useCase: string;
    minDiscount: number;
    availability: string;
    minRating: number;
}

interface FilterSidebarProps {
    onClose?: () => void;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    availableBrands: string[];
    contextQuery?: string | null;
}

const SELLER_OPTIONS = ['Amazon.in', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata Cliq', 'Jiomart'];

const PRICE_PRESETS = [
    { label: 'Under ₹10,000', max: 10000 },
    { label: 'Under ₹15,000', max: 15000 },
    { label: 'Under ₹20,000', max: 20000 },
    { label: 'Under ₹25,000', max: 25000 },
    { label: 'Under ₹30,000', max: 30000 },
    { label: 'Under ₹50,000', max: 50000 },
];

const DISCOUNT_OPTIONS = [
    { value: 10, label: '10% off or more' },
    { value: 20, label: '20% off or more' },
    { value: 30, label: '30% off or more' },
    { value: 50, label: '50% off or more' },
];

const AVAILABILITY_OPTIONS = [
    { id: 'instock', label: 'In Stock Only', icon: 'inventory_2' },
    { id: 'fast', label: 'Ships in 24 Hours', icon: 'local_shipping' },
    { id: 'free', label: 'Free Delivery', icon: 'redeem' },
];

const RATING_OPTIONS = [
    { value: 4, label: '4★ & above' },
    { value: 3, label: '3★ & above' },
    { value: 0, label: 'All Ratings' },
];

// --- Dynamic Filter Logic ---

interface FeatureOption { id: string; label: string; icon: string; }
interface UseCaseOption { id: string; label: string; icon: string; }

// Default (Mobile)
const DEFAULT_FEATURES: FeatureOption[] = [
    { id: '5g', label: '5G Phones', icon: 'signal_cellular_alt' },
    { id: 'ram8', label: '8GB+ RAM', icon: 'memory' },
    { id: 'storage256', label: '256GB+ Storage', icon: 'sd_storage' },
    { id: 'amoled', label: 'AMOLED Display', icon: 'screenshot_monitor' },
    { id: '120hz', label: '120Hz Refresh', icon: 'speed' },
    { id: 'fastcharge', label: 'Fast Charging', icon: 'bolt' },
];

const DEFAULT_USE_CASES: UseCaseOption[] = [
    { id: 'gaming', label: 'Best for Gaming', icon: 'sports_esports' },
    { id: 'camera', label: 'Best Camera', icon: 'photo_camera' },
    { id: 'battery', label: 'Best Battery Life', icon: 'battery_charging_full' },
    { id: 'value', label: 'Best Value', icon: 'verified' },
    { id: 'selfie', label: 'Best Selfie', icon: 'face' },
    { id: 'premium', label: 'Premium Flagship', icon: 'star' },
];

// Category Map
const CATEGORY_CONFIG: Record<string, { features: FeatureOption[]; useCases: UseCaseOption[] }> = {
    laptop: {
        features: [
            { id: 'touch', label: 'Touchscreen', icon: 'touch_app' },
            { id: 'ssd', label: 'SSD Storage', icon: 'hard_drive' },
            { id: 'backlit', label: 'Backlit Keys', icon: 'keyboard' },
            { id: '16gb', label: '16GB+ RAM', icon: 'memory' },
            { id: 'gpu', label: 'Dedicated GPU', icon: 'videogame_asset' },
            { id: 'light', label: 'Ultra Lightweight', icon: 'feather' },
        ],
        useCases: [
            { id: 'student', label: 'Best for Students', icon: 'school' },
            { id: 'gaming', label: 'Gaming', icon: 'sports_esports' },
            { id: 'coding', label: 'Programming', icon: 'code' },
            { id: 'business', label: 'Business', icon: 'business_center' },
            { id: 'creative', label: 'Video Editing', icon: 'movie_edit' },
        ]
    },
    audio: {
        features: [
            { id: 'enc', label: 'Noise Cancellation', icon: 'hearing_disabled' },
            { id: 'wireless', label: 'Wireless', icon: 'bluetooth' },
            { id: 'mic', label: 'Built-in Mic', icon: 'mic' },
            { id: 'water', label: 'Water Resistant', icon: 'water_drop' },
            { id: 'bass', label: 'Deep Bass', icon: 'speaker' },
        ],
        useCases: [
            { id: 'gym', label: 'Gym & Sports', icon: 'fitness_center' },
            { id: 'commute', label: 'Commuting', icon: 'train' },
            { id: 'calls', label: 'Calls', icon: 'call' },
            { id: 'audiophile', label: 'Audiophile', icon: 'graphic_eq' },
        ]
    },
    gaming: {
        features: [
            { id: '4k', label: '4K Gaming', icon: '4k' },
            { id: '120fps', label: '120 FPS Support', icon: 'speed' },
            { id: 'hdr', label: 'HDR Support', icon: 'hdr_on' },
            { id: 'digital', label: 'Digital Edition', icon: 'cloud_download' },
            { id: 'bundle', label: 'Game Bundle', icon: 'inventory' },
        ],
        useCases: [
            { id: 'hardcore', label: 'Hardcore Gaming', icon: 'sports_esports' },
            { id: 'family', label: 'Family Fun', icon: 'family_restroom' },
            { id: 'streaming', label: 'Streaming', icon: 'live_tv' },
            { id: 'vr', label: 'VR Ready', icon: 'view_in_ar' },
        ]
    },
    shoe: {
        features: [
            { id: 'running', label: 'Running', icon: 'sprint' },
            { id: 'casual', label: 'Casual', icon: 'checkroom' },
            { id: 'leather', label: 'Leather', icon: 'style' },
            { id: 'canvas', label: 'Canvas', icon: 'texture' },
            { id: 'waterproof', label: 'Waterproof', icon: 'water_drop' },
        ],
        useCases: [
            { id: 'sports', label: 'Sports', icon: 'sports_soccer' },
            { id: 'party', label: 'Party Wear', icon: 'celebration' },
            { id: 'office', label: 'Office', icon: 'work' },
            { id: 'walking', label: 'Walking', icon: 'directions_walk' },
        ]
    }
};

function getCategoryFromQuery(q: string): string {
    if (!q) return 'mobile';
    const query = q.toLowerCase();
    if (query.includes('laptop') || query.includes('macbook') || query.includes('notebook') || query.includes('pc')) return 'laptop';
    if (query.includes('headphone') || query.includes('earbud') || query.includes('speaker') || query.includes('audio')) return 'audio';
    if (query.includes('game') || query.includes('console') || query.includes('ps5') || query.includes('xbox') || query.includes('switch')) return 'gaming';
    if (query.includes('shoe') || query.includes('sneaker') || query.includes('boot') || query.includes('sandal')) return 'shoe';
    if (query.includes('phone') || query.includes('mobile') || query.includes('iphone') || query.includes('android')) return 'mobile';
    return 'default';
}

export function FilterSidebar({ onClose, filters, setFilters, availableBrands, contextQuery }: FilterSidebarProps) {

    // Compute dynamic options based on query
    const { features: dynamicFeatures, useCases: dynamicUseCases } = useMemo(() => {
        const cat = getCategoryFromQuery(contextQuery || '');
        if (CATEGORY_CONFIG[cat]) {
            return CATEGORY_CONFIG[cat];
        }
        // Default (Mobile) logic fallback
        return { features: DEFAULT_FEATURES, useCases: DEFAULT_USE_CASES };
    }, [contextQuery]);

    const handleClearAll = () => {
        setFilters({
            minPrice: 0,
            maxPrice: 300000,
            minTrustScore: 0,
            sellers: [],
            brands: [],
            features: [],
            useCase: '',
            minDiscount: 0,
            availability: '',
            minRating: 0,
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

    const toggleFeature = (featureId: string) => {
        setFilters(prev => ({
            ...prev,
            features: prev.features.includes(featureId)
                ? prev.features.filter(f => f !== featureId)
                : [...prev.features, featureId]
        }));
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        setFilters(prev => ({
            ...prev,
            [type === 'min' ? 'minPrice' : 'maxPrice']: num
        }));
    };

    const handlePricePreset = (max: number) => {
        setFilters(prev => ({
            ...prev,
            minPrice: 0,
            maxPrice: max
        }));
    };

    const handleTrustChange = (score: number) => {
        setFilters(prev => ({
            ...prev,
            minTrustScore: score
        }));
    };

    const handleUseCaseChange = (useCase: string) => {
        setFilters(prev => ({
            ...prev,
            useCase: prev.useCase === useCase ? '' : useCase
        }));
    };

    const handleDiscountChange = (discount: number) => {
        setFilters(prev => ({
            ...prev,
            minDiscount: prev.minDiscount === discount ? 0 : discount
        }));
    };

    const handleAvailabilityChange = (availability: string) => {
        setFilters(prev => ({
            ...prev,
            availability: prev.availability === availability ? '' : availability
        }));
    };

    const handleRatingChange = (rating: number) => {
        setFilters(prev => ({
            ...prev,
            minRating: rating
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

                {/* Quick Price Presets */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Quick Budget</h3>
                    <div className="flex flex-wrap gap-2">
                        {PRICE_PRESETS.map((preset) => (
                            <button
                                key={preset.max}
                                onClick={() => handlePricePreset(preset.max)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.maxPrice === preset.max && filters.minPrice === 0
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Price Range Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Custom Price</h3>
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

                {/* Popular Features Section - DYNAMIC */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Popular Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {dynamicFeatures.map((feature) => (
                            <button
                                key={feature.id}
                                onClick={() => toggleFeature(feature.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${filters.features.includes(feature.id)
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:border-primary/30'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">{feature.icon}</span>
                                {feature.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Use Case / Best For Section - DYNAMIC */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Best For</h3>
                    <div className="space-y-2">
                        {dynamicUseCases.map((useCase) => (
                            <button
                                key={useCase.id}
                                onClick={() => handleUseCaseChange(useCase.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.useCase === useCase.id
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{useCase.icon}</span>
                                {useCase.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Discount Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Discount</h3>
                    <div className="flex flex-wrap gap-2">
                        {DISCOUNT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleDiscountChange(option.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.minDiscount === option.value
                                    ? 'bg-green-500 text-white'
                                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Availability Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Availability</h3>
                    <div className="space-y-2">
                        {AVAILABILITY_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleAvailabilityChange(option.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.availability === option.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
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

                {/* Customer Rating Section */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Customer Rating</h3>
                    <div className="flex flex-wrap gap-2">
                        {RATING_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleRatingChange(option.value)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filters.minRating === option.value
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">star</span>
                                {option.label}
                            </button>
                        ))}
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
