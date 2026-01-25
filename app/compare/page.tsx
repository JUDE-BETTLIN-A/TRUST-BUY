"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Product } from '@/lib/mock-scraper';
import { getAIComparison, getAISpecs } from './actions';
import { getUserItem, setUserItem, removeUserItem, STORAGE_KEYS } from '@/lib/user-storage';

// Types for AI comparison
interface AIComparisonResult {
  winner: string;
  summary: string;
  categories: {
    name: string;
    product1Score: number;
    product2Score: number;
    verdict: string;
  }[];
  recommendation: string;
}

// Simulated specs for demo (in real app, these would come from scraping)
// Simulated specs removed to avoid mock data


export default function ComparePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.email || session?.user?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 🤖 AI Comparison State
  const [aiComparison, setAIComparison] = useState<AIComparisonResult | null>(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => {
    // Load compared products from localStorage (user-specific)
    const stored = getUserItem(STORAGE_KEYS.COMPARE, userId);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProducts(parsed);
      } catch (e) {
        console.error("Failed to parse compare data", e);
      }
    }
    setLoading(false);
  }, [userId]);

  // 🤖 Fetch AI Comparison when products change
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      if (products.length >= 2) {
        setAILoading(true);
        try {
          const result = await getAIComparison(
            products.slice(0, 2).map(p => ({
              title: p.title,
              price: p.price,
              specs: p.specs
            }))
          );
          if (result) {
            setAIComparison(result);
          }
        } catch (e) {
          console.error("AI comparison failed:", e);
        } finally {
          setAILoading(false);
        }
      }
    };

    if (products.length >= 2) {
      fetchAIAnalysis();
    }
  }, [products]);

  const removeProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    setUserItem(STORAGE_KEYS.COMPARE, JSON.stringify(updated), userId);
    setAIComparison(null); // Reset AI comparison
  };

  const clearAll = () => {
    setProducts([]);
    removeUserItem(STORAGE_KEYS.COMPARE, userId);
    setAIComparison(null);
  };

  // Find the best product (highest rating)
  const bestProductId = products.length > 0
    ? products.reduce((best, p) => p.rating > best.rating ? p : best, products[0]).id
    : null;

  if (loading) {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }


  if (products.length === 0) {
    return (
      <main className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">compare</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Products to Compare</h1>
          <p className="text-gray-500 mb-6">Select products from the search results to compare them side by side.</p>
          <button
            onClick={() => router.push('/search?q=smartphones')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary">Search</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Compare</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Comparing {products.length} Items
            </h1>
            <p className="text-gray-500 mt-1">
              Unbiased analysis based on price, trust score, and long-term value.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">share</span>
              Share
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Clear All
            </button>
          </div>
        </div>

        {/* Product Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product) => {
            const isBest = product.id === bestProductId;
            return (
              <div
                key={product.id}
                className={`relative bg-white dark:bg-surface-dark rounded-2xl border-2 p-6 transition-all ${isBest
                  ? 'border-primary shadow-lg shadow-primary/10'
                  : 'border-gray-100 dark:border-gray-800'
                  }`}
              >
                {/* Best Choice Badge */}
                {isBest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                    Top Choice
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>

                {/* Product Image */}
                <div className="h-40 flex items-center justify-center mb-4">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={150}
                    height={150}
                    className="max-h-full object-contain"
                  />
                </div>

                {/* Product Info */}
                <h3 className="font-bold text-gray-900 dark:text-white text-center line-clamp-2 mb-2">
                  {product.title}
                </h3>
                <div className="text-center">
                  <span className={`text-2xl font-bold ${isBest ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                    {product.price}
                  </span>
                  {isBest && (
                    <span className="ml-2 text-xs text-green-500 font-medium">Best Value</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add More Card */}
          {products.length < 4 && (
            <button
              onClick={() => router.back()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-primary hover:text-primary transition-colors min-h-[300px]"
            >
              <span className="material-symbols-outlined text-4xl">add_circle</span>
              <span className="font-medium">Add Product</span>
            </button>
          )}
        </div>

        {/* 🤖 AI Comparison Analysis Section */}
        {products.length >= 2 && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">psychology</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Comparison Analysis</h2>
                <p className="text-sm text-gray-500">Intelligent insights powered by AI</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 dark:text-gray-400">Analyzing products...</span>
              </div>
            ) : aiComparison ? (
              <div className="space-y-4">
                {/* Winner Banner */}
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">🏆 AI Recommendation</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{aiComparison.winner}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{aiComparison.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                {aiComparison.categories && aiComparison.categories.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {aiComparison.categories.map((cat, idx) => (
                      <div key={idx} className="bg-white dark:bg-surface-dark rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-gray-500 mb-2">{cat.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${cat.product1Score * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{cat.product1Score}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${cat.product2Score * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{cat.product2Score}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{cat.verdict}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white">
                  <p className="text-sm font-medium opacity-90">💡 Our Advice</p>
                  <p className="font-bold">{aiComparison.recommendation}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Unable to generate AI analysis. Please try again.</p>
            )}
          </div>
        )}

        {/* Attributes Comparison Table */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Attributes</h2>
          </div>

          {/* Trust Score Row */}
          <div className="grid grid-cols-[200px_1fr] border-b border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-primary text-sm">verified</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Trust Score</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => (
                <div key={product.id} className="px-6 py-4 border-l border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${product.rating >= 9 ? 'bg-green-500' :
                          product.rating >= 8 ? 'bg-primary' : 'bg-yellow-500'
                          }`}
                        style={{ width: `${product.rating * 10}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{product.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{product.trustScoreBadge}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seller Row */}
          <div className="grid grid-cols-[200px_1fr] border-b border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-gray-400 text-sm">storefront</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Seller</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => (
                <div key={product.id} className="px-6 py-4 border-l border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                      {product.storeName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.storeName}</p>
                      <p className="text-xs text-gray-500">Free Shipping</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Display Row */}
          <div className="grid grid-cols-[200px_1fr] border-b border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-gray-400 text-sm">smartphone</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Display</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => {
                return (
                  <div key={product.id} className="px-6 py-4 border-l border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-white">{product.specs?.display || 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Processor Row */}
          <div className="grid grid-cols-[200px_1fr] border-b border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-gray-400 text-sm">memory</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Processor</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => {
                return (
                  <div key={product.id} className="px-6 py-4 border-l border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-white">{product.specs?.processor || 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warranty Row */}
          <div className="grid grid-cols-[200px_1fr] border-b border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-gray-400 text-sm">verified_user</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Warranty</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => {
                return (
                  <div key={product.id} className="px-6 py-4 border-l border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Manufacturer Warranty
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Row */}
          <div className="grid grid-cols-[200px_1fr]">
            <div className="px-6 py-4 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <span className="material-symbols-outlined text-gray-400 text-sm">local_shipping</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Delivery</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
              {products.map((product) => {
                return (
                  <div key={product.id} className="px-6 py-4 border-l border-gray-100 dark:border-gray-800">
                    <p className="text-gray-900 dark:text-white">Standard Delivery</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {products.map((product) => {
            const isBest = product.id === bestProductId;
            return (
              <div key={product.id} className="flex flex-col gap-2">
                <a
                  href={product.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all ${isBest
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                    }`}
                >
                  {isBest ? 'Buy Now' : 'View Deal'}
                  <span className="material-symbols-outlined text-sm">{isBest ? 'shopping_cart' : 'open_in_new'}</span>
                </a>
                <p className="text-xs text-center text-gray-500">
                  {isBest ? 'Best Value • ' : ''}{product.storeName}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}