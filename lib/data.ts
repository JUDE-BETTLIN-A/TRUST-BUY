import { Product } from "./types";
import { prisma } from "./prisma";

// High-fidelity mock data generator (used for seeding only)
const mockProducts = [
  {
    id: "prod_1",
    name: "Sony WH-1000XM5 Wireless Headphones",
    category: "Audio",
    description: "Industry-leading noise canceling with Dual Noise Sensor processor. Premium sound quality with 30-hour battery life.",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC7Ai6DT_qxBGb3q_-vvz9vphj8atjvoqye6RGTwlfmi9CY1fWEF_mwXGNRRvM0TE9AEA0x88Ibr__ccmiF0gIXewkEvGbSoyDHIOkLPcI2iRBNTQm7AdlXGNcI29mP0IH-W6VoAZMlER6KO4dc9-Uh3NvvQtKaRKay5Q5HcU3foicERwR2p7NwCJVJnplNewTl58SVm4EE6yiwA2RrtrVINGj3giNvuSQVpmdfu8QUuA65iGcJPEpfnYjDh-CJkBNZCOTbG1dDdwY",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyKtWB0rR3Lm59JKusVukDFCeLbiUQx-RWpm6xsU3xK3KGbB5F94KqQs_5ehyvHhnyMaRj6mcm27NFF4zwCBEtLde3ZG2r-ZX53AICjMXSIzmYeDCWrlurUjY70CMNJTzBtLl7bvEhntQVAiEIhOPcOopaw460U-uKbiW2pTB7JbR3H7xowNNsP5gjB9qjZXo2ATy49UJmUY90lWPnbY97TrX29oDFU0yFcfqvF5DOqaFPoyaqobhuC6NPRN2ZnwAkY6nQ2G5-U_0"
    ],
    basePrice: 399.99,
    currentPrice: 348.00,
    discount: 13,
    rating: 4.8,
    reviewCount: 2340,
    trustScore: 92,
    specs: {
      "Battery": "30 Hours",
      "Type": "Over-ear",
      "Weight": "250g",
      "ANC": "Active (Dual Sensor)",
      "Chip": "",
      "RAM": "",
      "Storage": "",
      "Screen": "",
      "Camera": ""
    },
    priceHistory: [
      { date: "2023-11-01", price: 399.99 },
      { date: "2023-11-15", price: 389.99 },
      { date: "2023-12-01", price: 379.99 },
      { date: "2023-12-15", price: 355.00 },
      { date: "2024-01-01", price: 349.99 },
      { date: "2024-01-14", price: 348.00 },
    ],
    sellers: [
      {
        id: "seller_amz",
        name: "Amazon",
        logo: "Amz",
        price: 348.00,
        shipping: 0.00,
        rating: 4.8,
        trustScore: 95,
        badges: ["Best Price", "Free Shipping"],
        inStock: true,
      },
      {
        id: "seller_bb",
        name: "BestBuy",
        logo: "BB",
        price: 349.99,
        shipping: 0.00,
        rating: 4.7,
        trustScore: 90,
        badges: ["Pickup Today"],
        inStock: true,
      },
      {
        id: "seller_walmart",
        name: "Walmart",
        logo: "W",
        price: 355.00,
        shipping: 5.99,
        rating: 4.5,
        trustScore: 85,
        badges: ["Standard"],
        inStock: true,
      }
    ],
    tags: ["Audio", "Noise Canceling", "Wireless"],
  },
  {
    id: "prod_2",
    name: "MacBook Pro 14\" M3",
    category: "Laptops",
    description: "The M3 chip brings massive performance to the MacBook Pro. Liquid Retina XDR display.",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
    ],
    basePrice: 1599.00,
    currentPrice: 1599.00,
    discount: 0,
    rating: 4.9,
    reviewCount: 850,
    trustScore: 98,
    specs: {
      "Chip": "M3 Pro",
      "RAM": "18GB",
      "Storage": "512GB SSD",
      "Battery": "",
      "Type": "",
      "Weight": "",
      "ANC": "",
      "Screen": "",
      "Camera": ""
    },
    priceHistory: [
      { date: "2023-11-01", price: 1599.00 },
      { date: "2024-01-14", price: 1599.00 },
    ],
    sellers: [
      {
        id: "seller_apple",
        name: "Apple Store",
        logo: "Ap",
        price: 1599.00,
        shipping: 0.00,
        rating: 4.9,
        trustScore: 100,
        badges: ["Official"],
        inStock: true,
      }
    ],
    tags: ["Laptop", "Apple", "Pro"],
  },
  {
    id: "prod_3",
    name: "Samsung Galaxy S24 Ultra",
    category: "Phones",
    description: "Galaxy AI is here. Note assist, live translate, and a pro-grade camera system.",
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80"
    ],
    basePrice: 1299.00,
    currentPrice: 1199.00,
    discount: 8,
    rating: 4.7,
    reviewCount: 1200,
    trustScore: 89,
    specs: {
      "Screen": "6.8\" AMOLED",
      "Camera": "200MP",
      "Battery": "5000mAh",
      "Chip": "",
      "RAM": "",
      "Storage": "",
      "Type": "",
      "Weight": "",
      "ANC": ""
    },
    priceHistory: [
      { date: "2023-11-01", price: 1299.00 },
      { date: "2023-12-01", price: 1250.00 },
      { date: "2024-01-01", price: 1199.00 },
    ],
    sellers: [
      {
        id: "seller_samsung",
        name: "Samsung",
        logo: "Sa",
        price: 1199.00,
        shipping: 0.00,
        rating: 4.7,
        trustScore: 92,
        badges: ["Trade-in"],
        inStock: true,
      },
      {
        id: "seller_amz_2",
        name: "Amazon",
        logo: "Amz",
        price: 1210.00,
        shipping: 0.00,
        rating: 4.6,
        trustScore: 90,
        badges: ["Prime"],
        inStock: true,
      }
    ],
    tags: ["Phone", "Android", "AI"],
  }
];

// Database functions
export const getProducts = async (): Promise<Product[]> => {
  // In a real app, we would fetch from Prisma
  // For now, we return the mock data to ensure the UI works
  // If you want to use the database, uncomment the lines below:
  
  // const products = await prisma.product.findMany();
  // return products.map(p => ({
  //   ...p,
  //   images: JSON.parse(p.images as string),
  //   specs: JSON.parse(p.specs as string),
  //   priceHistory: JSON.parse(p.priceHistory as string),
  //   sellers: JSON.parse(p.sellers as string),
  //   tags: JSON.parse(p.tags as string),
  // }));

  return mockProducts;
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  // const product = await prisma.product.findUnique({ where: { id } });
  // if (!product) return undefined;
  // return {
  //   ...product,
  //   images: JSON.parse(product.images as string),
  //   specs: JSON.parse(product.specs as string),
  //   priceHistory: JSON.parse(product.priceHistory as string),
  //   sellers: JSON.parse(product.sellers as string),
  //   tags: JSON.parse(product.tags as string),
  // };
  
  return mockProducts.find((p) => p.id === id);
};

export const getTrendingProducts = async (): Promise<Product[]> => {
  const products = await getProducts();
  return products.slice(0, 2);
};

export const getSellers = async (): Promise<any[]> => {
  const products = await getProducts();
  const sellerMap = new Map();
  
  products.forEach(p => {
    p.sellers.forEach(s => {
      if (!sellerMap.has(s.id)) {
        sellerMap.set(s.id, {
          id: s.id,
          name: s.name,
          logo: s.logo,
          location: "United States", // Mock
          rating: s.rating,
          reviews: Math.floor(Math.random() * 500) + 100, // Mock
          shippingTime: "2-3 Days", // Mock
          returnRate: 2, // Mock
          trustScore: s.trustScore,
          verified: s.trustScore > 90
        });
      }
    });
  });
  
  return Array.from(sellerMap.values());
};
