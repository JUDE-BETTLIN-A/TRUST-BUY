export interface Product {
    id: string;
    title: string;
    price: string;
    image: string;
    storeName: string;
    model: string;
    category: string;
    brand: string;
    bestPrice: boolean;
    rating: number;
    trustScoreBadge: string;
    link?: string;
}

const STORES = ['Amazon.in', 'Flipkart', 'Croma', 'Reliance Digital', 'Tata Cliq', 'Jiomart'];

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function searchProducts(query: string, page: number = 1): Promise<Product[]> {
    // Simulate network delay to feel like "scraping"
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Capitalize query for titles
    const formattedQuery = query.charAt(0).toUpperCase() + query.slice(1);
    const isTrending = query.toLowerCase().includes('trending');

    // Generate 4-8 results
    const count = isTrending ? 8 : getRandomInt(4, 8);
    const results: Product[] = [];

    // Shuffle array helper
    const shuffle = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const TRENDING_ITEMS = shuffle([
        "Sony WH-1000XM5 Wireless Headphones",
        "Apple MacBook Air M2",
        "Samsung 65\" Class OLED 4K Smart TV",
        "PlayStation 5 Console (Slim)",
        "Dyson V15 Detect Cordless Vacuum",
        "Nintendo Switch OLED Model",
        "iPad Air 11-inch (M2)",
        "KitchenAid Artisan Series 5-Qt Stand Mixer",
        "Nespresso Vertuo Plus Coffee and Espresso Maker by De'Longhi",
        "Instant Pot Duo 7-in-1 Electric Pressure Cooker"
    ]);

    const TRENDING_IMAGES: Record<string, string> = {
        "Sony WH-1000XM5 Wireless Headphones": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&auto=format&fit=crop&q=60",
        "Apple MacBook Air M2": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&auto=format&fit=crop&q=60",
        "Samsung 65\" Class OLED 4K Smart TV": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=60",
        "PlayStation 5 Console (Slim)": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop&q=60",
        "Dyson V15 Detect Cordless Vacuum": "https://images.unsplash.com/photo-1558317374-a3594743e488?w=500&auto=format&fit=crop&q=60",
        "Nintendo Switch OLED Model": "https://images.unsplash.com/photo-1578303512597-8198dd382374?w=500&auto=format&fit=crop&q=60",
        "iPad Air 11-inch (M2)": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60",
        "KitchenAid Artisan Series 5-Qt Stand Mixer": "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=500&auto=format&fit=crop&q=60",
        "Nespresso Vertuo Plus Coffee and Espresso Maker by De'Longhi": "https://images.unsplash.com/photo-1517036662718-4a1c5d070104?w=500&auto=format&fit=crop&q=60",
        "Instant Pot Duo 7-in-1 Electric Pressure Cooker": "https://images.unsplash.com/photo-1588645258673-424fa752f404?w=500&auto=format&fit=crop&q=60"
    };

    const KEYWORD_IMAGES: Record<string, string> = {
        "ps5": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop&q=60",
        "playstation": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop&q=60",
        "macbook": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&auto=format&fit=crop&q=60",
        "iphone": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60",
        "samsung": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=60",
        "tv": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=60",
        "headphone": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        "watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
        "camera": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60",
        "laptop": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&auto=format&fit=crop&q=60",
        "coffee": "https://images.unsplash.com/photo-1517036662718-4a1c5d070104?w=500&auto=format&fit=crop&q=60",
        "cooker": "https://images.unsplash.com/photo-1588645258673-424fa752f404?w=500&auto=format&fit=crop&q=60",
        "vacuum": "https://images.unsplash.com/photo-1558317374-a3594743e488?w=500&auto=format&fit=crop&q=60",
        "home": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60",
        "furniture": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop&q=60",
        "fashion": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=60",
        "clothes": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60",
        "sports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=60",
        "auto": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop&q=60",
        "car": "https://images.unsplash.com/photo-1503376763036-066120622c74?w=500&auto=format&fit=crop&q=60"
    };

    for (let i = 0; i < count; i++) {
        const store = STORES[Math.floor(Math.random() * STORES.length)];
        const priceValUSD = getRandomInt(50, 1500); // Base value
        const priceValINR = priceValUSD * 84; // Approx conversion
        // Format as Indian Rupee
        const formattedPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(priceValINR);

        const isBestPrice = i === 0 || Math.random() > 0.8;

        let title = `${formattedQuery} ${i % 2 === 0 ? 'Pro' : 'Standard'} Edition - ${store} Exclusive Bundle`;
        let image = "";

        // Check if query matches a known keyword for reliable image
        const lowerQuery = query.toLowerCase();
        let keywordMatch = Object.keys(KEYWORD_IMAGES).find(key => lowerQuery.includes(key));

        if (isTrending) {
            title = TRENDING_ITEMS[i % TRENDING_ITEMS.length];
            image = TRENDING_IMAGES[title] || "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=60";
        } else if (keywordMatch) {
            image = KEYWORD_IMAGES[keywordMatch];
        } else {
            // Use Pollinations.ai for relevant product images based on the query.
            // Clean simple title for better AI generation if undefined
            image = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}%20product%20photo%20hq%20white%20background?width=400&height=400&nologo=true&seed=${i}`;
        }

        const rating = Number((Math.random() * 2.4 + 7.5).toFixed(1));
        const trustBadge = rating > 9.2 ? "Excellent" : rating > 8.5 ? "Very Good" : "Good";

        // Extract a "brand" - very simplified
        let brand = "Generic";
        const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG"];
        const foundBrand = brands.find(b => title.toLowerCase().includes(b.toLowerCase()));
        if (foundBrand) {
            brand = foundBrand;
        } else if (isTrending) {
            brand = title.split(' ')[0];
        }

        results.push({
            id: `prod-${page}-${i}-${formattedQuery.replace(/\s+/g, '-')}`,
            title: title,
            price: formattedPrice,
            image: image,
            storeName: store,
            model: `GEN-${getRandomInt(1000, 9999)}`,
            category: "General",
            brand: brand,
            bestPrice: isBestPrice,
            rating: rating,
            trustScoreBadge: trustBadge,
            link: `https://www.google.com/search?q=${encodeURIComponent(title)}`
        });
    }

    return results;
}
