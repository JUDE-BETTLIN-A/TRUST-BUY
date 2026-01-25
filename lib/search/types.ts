export interface UnifiedSearchResult {
    title: string;
    price: number;
    mrp?: number;
    discount?: number;
    image: string;
    rating: number;
    rating_count: number;
    seller?: string;
    source: 'Amazon' | 'Flipkart' | 'Myntra' | 'Ajio' | 'Croma' | 'Reliance' | 'TataCliq' | 'Snapdeal' | 'ShopClues' | 'Unknown';
    product_url: string;
    trust_score?: number;
}

export interface SearchOptions {
    query: string;
    page?: number;
}
