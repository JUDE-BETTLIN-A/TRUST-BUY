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

const SELLER_OPTIONS = [
    'Amazon.in', 'Flipkart', 'Croma', 'Reliance', 'Snapdeal', 
    'Ajio', 'Myntra', 'Meesho', 'TataCliq', 'Jiomart', 'ShopClues', 'BingShopping'
];

// Dynamic price presets based on product category
const PRICE_PRESETS_BY_CATEGORY: Record<string, { label: string; max: number }[]> = {
    mobile: [
        { label: 'Under ₹10,000', max: 10000 },
        { label: 'Under ₹15,000', max: 15000 },
        { label: 'Under ₹25,000', max: 25000 },
        { label: 'Under ₹50,000', max: 50000 },
        { label: 'Under ₹1,00,000', max: 100000 },
    ],
    laptop: [
        { label: 'Under ₹30,000', max: 30000 },
        { label: 'Under ₹50,000', max: 50000 },
        { label: 'Under ₹75,000', max: 75000 },
        { label: 'Under ₹1,00,000', max: 100000 },
        { label: 'Under ₹1,50,000', max: 150000 },
    ],
    fashion: [
        { label: 'Under ₹500', max: 500 },
        { label: 'Under ₹1,000', max: 1000 },
        { label: 'Under ₹2,000', max: 2000 },
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
    ],
    shoe: [
        { label: 'Under ₹1,000', max: 1000 },
        { label: 'Under ₹2,000', max: 2000 },
        { label: 'Under ₹3,000', max: 3000 },
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
    ],
    kitchen: [
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
        { label: 'Under ₹15,000', max: 15000 },
        { label: 'Under ₹25,000', max: 25000 },
        { label: 'Under ₹50,000', max: 50000 },
    ],
    tv: [
        { label: 'Under ₹15,000', max: 15000 },
        { label: 'Under ₹25,000', max: 25000 },
        { label: 'Under ₹40,000', max: 40000 },
        { label: 'Under ₹60,000', max: 60000 },
        { label: 'Under ₹1,00,000', max: 100000 },
    ],
    audio: [
        { label: 'Under ₹1,000', max: 1000 },
        { label: 'Under ₹2,000', max: 2000 },
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
        { label: 'Under ₹20,000', max: 20000 },
    ],
    watch: [
        { label: 'Under ₹2,000', max: 2000 },
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
        { label: 'Under ₹25,000', max: 25000 },
        { label: 'Under ₹50,000', max: 50000 },
    ],
    appliance: [
        { label: 'Under ₹15,000', max: 15000 },
        { label: 'Under ₹25,000', max: 25000 },
        { label: 'Under ₹40,000', max: 40000 },
        { label: 'Under ₹60,000', max: 60000 },
        { label: 'Under ₹1,00,000', max: 100000 },
    ],
    beauty: [
        { label: 'Under ₹200', max: 200 },
        { label: 'Under ₹500', max: 500 },
        { label: 'Under ₹1,000', max: 1000 },
        { label: 'Under ₹2,000', max: 2000 },
        { label: 'Under ₹5,000', max: 5000 },
    ],
    bags: [
        { label: 'Under ₹1,000', max: 1000 },
        { label: 'Under ₹2,000', max: 2000 },
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
        { label: 'Under ₹20,000', max: 20000 },
    ],
    default: [
        { label: 'Under ₹5,000', max: 5000 },
        { label: 'Under ₹10,000', max: 10000 },
        { label: 'Under ₹25,000', max: 25000 },
        { label: 'Under ₹50,000', max: 50000 },
        { label: 'Under ₹1,00,000', max: 100000 },
    ],
};

function getPricePresets(category: string): { label: string; max: number }[] {
    return PRICE_PRESETS_BY_CATEGORY[category] || PRICE_PRESETS_BY_CATEGORY.default;
}

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

// Category Map - Dynamic filters based on product category
const CATEGORY_CONFIG: Record<string, { features: FeatureOption[]; useCases: UseCaseOption[] }> = {
    laptop: {
        features: [
            { id: 'touch', label: 'Touchscreen', icon: 'touch_app' },
            { id: 'ssd', label: 'SSD Storage', icon: 'storage' },
            { id: 'backlit', label: 'Backlit Keys', icon: 'keyboard' },
            { id: '16gb', label: '16GB+ RAM', icon: 'memory' },
            { id: 'gpu', label: 'Dedicated GPU', icon: 'videogame_asset' },
            { id: 'light', label: 'Ultra Lightweight', icon: 'scale' },
        ],
        useCases: [
            { id: 'student', label: 'Best for Students', icon: 'school' },
            { id: 'gaming', label: 'Gaming', icon: 'sports_esports' },
            { id: 'coding', label: 'Programming', icon: 'code' },
            { id: 'business', label: 'Business', icon: 'business_center' },
            { id: 'creative', label: 'Video Editing', icon: 'movie' },
        ]
    },
    audio: {
        features: [
            { id: 'anc', label: 'Noise Cancellation', icon: 'hearing_disabled' },
            { id: 'wireless', label: 'Wireless', icon: 'bluetooth' },
            { id: 'mic', label: 'Built-in Mic', icon: 'mic' },
            { id: 'water', label: 'Water Resistant', icon: 'water_drop' },
            { id: 'bass', label: 'Deep Bass', icon: 'speaker' },
            { id: 'longbattery', label: 'Long Battery', icon: 'battery_full' },
        ],
        useCases: [
            { id: 'gym', label: 'Gym & Sports', icon: 'fitness_center' },
            { id: 'commute', label: 'Commuting', icon: 'train' },
            { id: 'calls', label: 'Calls & Meetings', icon: 'call' },
            { id: 'audiophile', label: 'Audiophile', icon: 'graphic_eq' },
            { id: 'gaming', label: 'Gaming', icon: 'sports_esports' },
        ]
    },
    gaming: {
        features: [
            { id: '4k', label: '4K Gaming', icon: 'hd' },
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
    // Fashion - Clothing, Shoes, Accessories
    fashion: {
        features: [
            { id: 'cotton', label: 'Cotton', icon: 'checkroom' },
            { id: 'polyester', label: 'Polyester', icon: 'dry_cleaning' },
            { id: 'silk', label: 'Silk/Satin', icon: 'styler' },
            { id: 'denim', label: 'Denim', icon: 'checkroom' },
            { id: 'leather', label: 'Leather', icon: 'texture' },
            { id: 'organic', label: 'Organic Fabric', icon: 'eco' },
        ],
        useCases: [
            { id: 'casual', label: 'Casual Wear', icon: 'weekend' },
            { id: 'formal', label: 'Formal/Office', icon: 'work' },
            { id: 'party', label: 'Party Wear', icon: 'celebration' },
            { id: 'sports', label: 'Sports/Gym', icon: 'fitness_center' },
            { id: 'ethnic', label: 'Ethnic/Traditional', icon: 'stars' },
            { id: 'winter', label: 'Winter Wear', icon: 'ac_unit' },
        ]
    },
    shoe: {
        features: [
            { id: 'running', label: 'Running', icon: 'directions_run' },
            { id: 'casual', label: 'Casual', icon: 'checkroom' },
            { id: 'leather', label: 'Leather', icon: 'texture' },
            { id: 'canvas', label: 'Canvas', icon: 'grid_view' },
            { id: 'waterproof', label: 'Waterproof', icon: 'water_drop' },
            { id: 'memory', label: 'Memory Foam', icon: 'cloud' },
        ],
        useCases: [
            { id: 'sports', label: 'Sports', icon: 'sports_soccer' },
            { id: 'party', label: 'Party Wear', icon: 'celebration' },
            { id: 'office', label: 'Office', icon: 'work' },
            { id: 'walking', label: 'Daily Walking', icon: 'directions_walk' },
            { id: 'hiking', label: 'Hiking/Outdoor', icon: 'hiking' },
        ]
    },
    // Kitchen Appliances - Oven, Microwave, etc.
    kitchen: {
        features: [
            { id: 'convection', label: 'Convection', icon: 'air' },
            { id: 'grill', label: 'Grill Mode', icon: 'outdoor_grill' },
            { id: 'autocook', label: 'Auto-Cook Menu', icon: 'restaurant_menu' },
            { id: 'timer', label: 'Timer Function', icon: 'timer' },
            { id: 'digital', label: 'Digital Display', icon: 'touch_app' },
            { id: 'stainless', label: 'Stainless Steel', icon: 'looks' },
        ],
        useCases: [
            { id: 'baking', label: 'Baking', icon: 'bakery_dining' },
            { id: 'reheating', label: 'Reheating', icon: 'whatshot' },
            { id: 'grilling', label: 'Grilling', icon: 'outdoor_grill' },
            { id: 'family', label: 'Large Family', icon: 'family_restroom' },
            { id: 'solo', label: 'Solo/Compact', icon: 'person' },
        ]
    },
    // TV & Display
    tv: {
        features: [
            { id: '4k', label: '4K Ultra HD', icon: 'hd' },
            { id: 'smart', label: 'Smart TV', icon: 'smart_display' },
            { id: 'oled', label: 'OLED/QLED', icon: 'tv' },
            { id: 'hdr', label: 'HDR Support', icon: 'hdr_on' },
            { id: 'dolby', label: 'Dolby Audio', icon: 'surround_sound' },
            { id: 'voice', label: 'Voice Control', icon: 'mic' },
        ],
        useCases: [
            { id: 'movies', label: 'Movies & Shows', icon: 'movie' },
            { id: 'gaming', label: 'Gaming', icon: 'sports_esports' },
            { id: 'sports', label: 'Sports', icon: 'sports_cricket' },
            { id: 'bedroom', label: 'Bedroom', icon: 'bed' },
            { id: 'living', label: 'Living Room', icon: 'living' },
        ]
    },
    // Watches - Smart & Regular
    watch: {
        features: [
            { id: 'smart', label: 'Smart Watch', icon: 'watch' },
            { id: 'fitness', label: 'Fitness Tracker', icon: 'monitor_heart' },
            { id: 'gps', label: 'Built-in GPS', icon: 'location_on' },
            { id: 'water', label: 'Water Resistant', icon: 'water_drop' },
            { id: 'amoled', label: 'AMOLED Display', icon: 'brightness_high' },
            { id: 'calling', label: 'Bluetooth Calling', icon: 'call' },
        ],
        useCases: [
            { id: 'fitness', label: 'Fitness & Health', icon: 'fitness_center' },
            { id: 'daily', label: 'Daily Wear', icon: 'schedule' },
            { id: 'luxury', label: 'Luxury/Premium', icon: 'diamond' },
            { id: 'outdoor', label: 'Outdoor/Adventure', icon: 'hiking' },
            { id: 'casual', label: 'Casual', icon: 'weekend' },
        ]
    },
    // Refrigerators & AC
    appliance: {
        features: [
            { id: 'inverter', label: 'Inverter Tech', icon: 'electrical_services' },
            { id: 'energysave', label: 'Energy Saving', icon: 'eco' },
            { id: 'frost', label: 'Frost Free', icon: 'ac_unit' },
            { id: 'convertible', label: 'Convertible', icon: 'sync_alt' },
            { id: 'wifi', label: 'WiFi Enabled', icon: 'wifi' },
            { id: 'star5', label: '5 Star Rating', icon: 'star' },
        ],
        useCases: [
            { id: 'family', label: 'Large Family', icon: 'family_restroom' },
            { id: 'couple', label: 'Couple/Small', icon: 'people' },
            { id: 'bachelor', label: 'Bachelor', icon: 'person' },
            { id: 'energy', label: 'Low Power Bill', icon: 'savings' },
        ]
    },
    // Camera & Photography
    camera: {
        features: [
            { id: 'mirrorless', label: 'Mirrorless', icon: 'camera' },
            { id: 'dslr', label: 'DSLR', icon: 'photo_camera' },
            { id: '4kvideo', label: '4K Video', icon: 'videocam' },
            { id: 'stabilize', label: 'Image Stabilization', icon: 'motion_photos_on' },
            { id: 'wifi', label: 'WiFi Transfer', icon: 'wifi' },
            { id: 'touchscreen', label: 'Touchscreen', icon: 'touch_app' },
        ],
        useCases: [
            { id: 'beginner', label: 'Beginner', icon: 'school' },
            { id: 'professional', label: 'Professional', icon: 'work' },
            { id: 'vlogging', label: 'Vlogging', icon: 'videocam' },
            { id: 'travel', label: 'Travel', icon: 'flight' },
            { id: 'wildlife', label: 'Wildlife', icon: 'pets' },
        ]
    },
    // Beauty & Personal Care
    beauty: {
        features: [
            { id: 'organic', label: 'Organic/Natural', icon: 'eco' },
            { id: 'vegan', label: 'Vegan', icon: 'spa' },
            { id: 'spf', label: 'SPF Protection', icon: 'wb_sunny' },
            { id: 'sulfatefree', label: 'Sulfate Free', icon: 'science' },
            { id: 'derma', label: 'Dermatologist Tested', icon: 'verified' },
        ],
        useCases: [
            { id: 'dryskin', label: 'Dry Skin', icon: 'water_drop' },
            { id: 'oilyskin', label: 'Oily Skin', icon: 'opacity' },
            { id: 'sensitive', label: 'Sensitive Skin', icon: 'healing' },
            { id: 'antiaging', label: 'Anti-Aging', icon: 'self_improvement' },
            { id: 'haircare', label: 'Hair Care', icon: 'face' },
        ]
    },
    // Furniture & Home
    furniture: {
        features: [
            { id: 'wood', label: 'Solid Wood', icon: 'forest' },
            { id: 'engineered', label: 'Engineered Wood', icon: 'view_in_ar' },
            { id: 'metal', label: 'Metal Frame', icon: 'construction' },
            { id: 'storage', label: 'With Storage', icon: 'inventory_2' },
            { id: 'foldable', label: 'Foldable', icon: 'unfold_less' },
        ],
        useCases: [
            { id: 'bedroom', label: 'Bedroom', icon: 'bed' },
            { id: 'living', label: 'Living Room', icon: 'living' },
            { id: 'office', label: 'Home Office', icon: 'home_work' },
            { id: 'kids', label: 'Kids Room', icon: 'child_care' },
            { id: 'outdoor', label: 'Outdoor', icon: 'deck' },
        ]
    },
    // Bags & Luggage
    bags: {
        features: [
            { id: 'leather', label: 'Leather', icon: 'texture' },
            { id: 'waterproof', label: 'Waterproof', icon: 'water_drop' },
            { id: 'laptop', label: 'Laptop Sleeve', icon: 'laptop' },
            { id: 'usb', label: 'USB Charging', icon: 'usb' },
            { id: 'antitheft', label: 'Anti-Theft', icon: 'lock' },
            { id: 'wheels', label: 'Trolley/Wheels', icon: 'luggage' },
        ],
        useCases: [
            { id: 'travel', label: 'Travel', icon: 'flight' },
            { id: 'office', label: 'Office', icon: 'work' },
            { id: 'college', label: 'College', icon: 'school' },
            { id: 'gym', label: 'Gym', icon: 'fitness_center' },
            { id: 'hiking', label: 'Hiking', icon: 'hiking' },
        ]
    },
};

function getCategoryFromQuery(q: string): string {
    if (!q) return 'mobile';
    const query = q.toLowerCase();
    
    // Laptop & Computer
    if (query.includes('laptop') || query.includes('macbook') || query.includes('notebook') || query.includes('chromebook')) return 'laptop';
    
    // Audio - Headphones, Speakers, Earbuds
    if (query.includes('headphone') || query.includes('earbud') || query.includes('speaker') || query.includes('audio') || 
        query.includes('airpod') || query.includes('soundbar') || query.includes('earphone')) return 'audio';
    
    // Gaming
    if (query.includes('ps5') || query.includes('xbox') || query.includes('switch') || query.includes('playstation') || 
        query.includes('gaming console')) return 'gaming';
    
    // Shoes & Footwear
    if (query.includes('shoe') || query.includes('sneaker') || query.includes('boot') || query.includes('sandal') || 
        query.includes('slipper') || query.includes('loafer') || query.includes('heel') || query.includes('footwear')) return 'shoe';
    
    // Fashion - Clothing & Apparel
    if (query.includes('shirt') || query.includes('tshirt') || query.includes('t-shirt') || query.includes('jeans') || 
        query.includes('dress') || query.includes('kurta') || query.includes('saree') || query.includes('jacket') || 
        query.includes('hoodie') || query.includes('sweater') || query.includes('trouser') || query.includes('pant') || 
        query.includes('legging') || query.includes('top') || query.includes('blouse') || query.includes('skirt') ||
        query.includes('suit') || query.includes('blazer') || query.includes('ethnic') || query.includes('western') ||
        query.includes('men clothing') || query.includes('women clothing') || query.includes('fashion')) return 'fashion';
    
    // Kitchen Appliances - Oven, Microwave, etc.
    if (query.includes('oven') || query.includes('microwave') || query.includes('otg') || query.includes('toaster') || 
        query.includes('mixer') || query.includes('grinder') || query.includes('blender') || query.includes('juicer') || 
        query.includes('air fryer') || query.includes('induction') || query.includes('cooktop') || query.includes('chimney') ||
        query.includes('food processor') || query.includes('coffee maker') || query.includes('kettle')) return 'kitchen';
    
    // TV & Display
    if (query.includes('tv') || query.includes('television') || query.includes('smart tv') || query.includes('led tv') || 
        query.includes('oled') || query.includes('qled') || query.includes('monitor') || query.includes('display') ||
        query.includes('projector')) return 'tv';
    
    // Watches
    if (query.includes('watch') || query.includes('smartwatch') || query.includes('smart watch') || query.includes('fitbit') ||
        query.includes('fitness band') || query.includes('tracker')) return 'watch';
    
    // Large Appliances - Refrigerator, AC, Washing Machine
    if (query.includes('refrigerator') || query.includes('fridge') || query.includes('washing machine') || 
        query.includes('ac') || query.includes('air conditioner') || query.includes('cooler') || query.includes('geyser') ||
        query.includes('water heater') || query.includes('dishwasher') || query.includes('dryer')) return 'appliance';
    
    // Camera & Photography
    if (query.includes('camera') || query.includes('dslr') || query.includes('mirrorless') || query.includes('gopro') || 
        query.includes('lens') || query.includes('tripod') || query.includes('drone')) return 'camera';
    
    // Beauty & Personal Care
    if (query.includes('skincare') || query.includes('makeup') || query.includes('cosmetic') || query.includes('perfume') || 
        query.includes('shampoo') || query.includes('conditioner') || query.includes('serum') || query.includes('moisturizer') ||
        query.includes('lipstick') || query.includes('foundation') || query.includes('sunscreen') || query.includes('trimmer') ||
        query.includes('hair dryer') || query.includes('straightener')) return 'beauty';
    
    // Furniture & Home
    if (query.includes('sofa') || query.includes('bed') || query.includes('mattress') || query.includes('chair') || 
        query.includes('table') || query.includes('desk') || query.includes('wardrobe') || query.includes('cupboard') ||
        query.includes('furniture') || query.includes('bookshelf') || query.includes('cabinet')) return 'furniture';
    
    // Bags & Luggage
    if (query.includes('bag') || query.includes('backpack') || query.includes('luggage') || query.includes('suitcase') || 
        query.includes('handbag') || query.includes('purse') || query.includes('wallet') || query.includes('trolley')) return 'bags';
    
    // Mobile Phones (default for phone-related)
    if (query.includes('phone') || query.includes('mobile') || query.includes('iphone') || query.includes('samsung') || 
        query.includes('oneplus') || query.includes('pixel') || query.includes('redmi') || query.includes('realme') ||
        query.includes('vivo') || query.includes('oppo') || query.includes('poco') || query.includes('nothing')) return 'mobile';
    
    return 'default';
}

export function FilterSidebar({ onClose, filters, setFilters, availableBrands, contextQuery }: FilterSidebarProps) {

    // Compute dynamic options based on query
    const { features: dynamicFeatures, useCases: dynamicUseCases, pricePresets: dynamicPricePresets } = useMemo(() => {
        const cat = getCategoryFromQuery(contextQuery || '');
        const pricePresets = getPricePresets(cat);
        if (CATEGORY_CONFIG[cat]) {
            return { ...CATEGORY_CONFIG[cat], pricePresets };
        }
        // Default (Mobile) logic fallback
        return { features: DEFAULT_FEATURES, useCases: DEFAULT_USE_CASES, pricePresets };
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

                {/* Quick Price Presets - Dynamic based on category */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Quick Budget</h3>
                    <div className="flex flex-wrap gap-2">
                        {dynamicPricePresets.map((preset) => (
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

                {/* Trust Score Section - Enhanced with visual badges */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Trust Score</h3>
                    <div className="space-y-2">
                        {[
                            { score: 9.0, label: 'Excellent', color: 'emerald' },
                            { score: 8.0, label: 'Very Good', color: 'green' },
                            { score: 7.0, label: 'Good', color: 'lime' },
                            { score: 6.0, label: 'Average', color: 'yellow' },
                        ].map(({ score, label, color }) => (
                            <button
                                key={`score-${score}`}
                                onClick={() => handleTrustChange(score)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.minTrustScore === score
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">verified</span>
                                    <span>{score.toFixed(1)}+ {label}</span>
                                </div>
                                <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${filters.minTrustScore === score ? 'bg-white/20' : `bg-${color}-100 text-${color}-600`}`}>
                                    {score.toFixed(1)}
                                </div>
                            </button>
                        ))}
                        <button
                            onClick={() => handleTrustChange(0)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.minTrustScore === 0
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">select_all</span>
                            All Trust Scores
                        </button>
                    </div>
                </section>

                {/* Customer Rating Section - Enhanced with star visualization */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3">Customer Rating</h3>
                    <div className="space-y-2">
                        {[
                            { value: 4.5, label: '4.5★ & above', stars: 5 },
                            { value: 4, label: '4★ & above', stars: 4 },
                            { value: 3.5, label: '3.5★ & above', stars: 4 },
                            { value: 3, label: '3★ & above', stars: 3 },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleRatingChange(option.value)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.minRating === option.value
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                                }`}
                            >
                                <span>{option.label}</span>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`material-symbols-outlined text-sm ${i < option.stars ? (filters.minRating === option.value ? 'text-white' : 'text-amber-500') : 'text-gray-300'}`}
                                        >
                                            star
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                        <button
                            onClick={() => handleRatingChange(0)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${filters.minRating === 0
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">select_all</span>
                            All Ratings
                        </button>
                    </div>
                </section>

                {/* Sellers Section - Enhanced with grid layout */}
                <section className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Sellers</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {SELLER_OPTIONS.map((seller) => (
                            <button
                                key={`seller-${seller}`}
                                onClick={() => toggleSeller(seller)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${filters.sellers.includes(seller)
                                    ? 'bg-primary/10 text-primary border border-primary'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:border-primary/30'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">storefront</span>
                                {seller}
                            </button>
                        ))}
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
