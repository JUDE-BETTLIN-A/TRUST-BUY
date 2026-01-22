export interface PricePoint {
  date: string;
  price: number;
}

export interface Seller {
  id: string;
  name: string;
  logo: string;
  price: number;
  shipping: number;
  rating: number;
  trustScore: number;
  badges: string[];
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  basePrice: number;
  currentPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  trustScore: number; // 0-100
  specs: Record<string, string>;
  priceHistory: PricePoint[];
  sellers: Seller[];
  tags: string[];
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  image: string;
  budget: number;
  trackedItems: string[]; // Product IDs
}
