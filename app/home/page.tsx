"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { getHistory, HistoryItem } from '@/lib/history';
import { searchProductsAction } from '../search/actions';
// import { searchProducts as searchProductsMock } from '@/lib/mock-scraper';
import { getAlerts } from '../alerts/actions';
import { Product } from '@/lib/mock-scraper';
import { TrendingCard } from '@/components/TrendingCard';
import { getUserItem, STORAGE_KEYS } from '@/lib/user-storage';

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.email || session?.user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('Electronics');
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Dashboard State
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  const [basketCount, setBasketCount] = useState(0);
  const [displayName, setDisplayName] = useState(session?.user?.name || "User");

  useEffect(() => {
    // Sync Display Name (user-specific)
    const updateProfile = () => {
      const savedName = getUserItem(STORAGE_KEYS.NAME, userId);
      if (savedName) {
        setDisplayName(savedName);
      } else if (session?.user?.name) {
        setDisplayName(session.user.name);
      }
    };
    updateProfile();
    window.addEventListener('trustbuy_profile_update', updateProfile);

    // Load last 3 history items (user-specific)
    const h = getHistory(userId);
    setHistory(h.slice(0, 3));

    // Fetch Dashboard Data if logged in
    if (session?.user) {
      getAlerts().then(alerts => {
        setActiveAlertsCount(alerts.length);

      }).catch(err => console.error("Failed to load alerts", err));

      // Get basket count (user-specific)
      const basketData = getUserItem(STORAGE_KEYS.BASKET, userId);
      const basket = basketData ? JSON.parse(basketData) : [];
      setBasketCount(basket.length);
    }

    const fetchTrending = async () => {
      const shuffleArray = (arr: Product[]) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      // Movie filter keywords accessible to both try/catch
      const movieKeywords = ['movie', 'movies', 'film', 'dvd', 'blu-ray', 'bluray', 'box set', 'boxset', 'collection', 'soundtrack'];
      const isMovie = (p: Product) => {
        const t = (p.title || '').toLowerCase();
        const c = (p.category || '').toLowerCase();
        return movieKeywords.some(k => t.includes(k) || c.includes(k));
      };

      try {
        // Use a specific trending query to ensure we get trending products
        const products = await searchProductsAction("trending", 1);

        // Shuffle results to show different products on each refresh, then filter out movie-like items
        const shuffled = shuffleArray(products);
        let trendingProducts = shuffled.filter(p => !isMovie(p));

        // If we don't have enough results, we just show what we have (no mock data)
        trendingProducts = trendingProducts.slice(0, 4);

        console.log("Trending products loaded (after filtering movies & shuffling):", trendingProducts.length);
        setTrendingProducts(trendingProducts);
      } catch (e) {
        console.error("Failed to load trending items", e);
        setTrendingProducts([]);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();

    return () => window.removeEventListener('trustbuy_profile_update', updateProfile);
  }, [session, userId]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <main className="flex-1 h-full overflow-y-auto relative scroll-smooth bg-background-light dark:bg-background-dark">
      {/* Top Gradient Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-12 relative z-10 flex flex-col min-h-full">

        {/* Conditional Header: Dashboard vs Generic */}
        {session?.user ? (
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Welcome back, <span className="text-primary">{displayName?.split(' ')[0]}!</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Here is your daily shopping intelligence briefing.
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Dashboard Stats / Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div onClick={() => router.push('/alerts')} className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">Active</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{activeAlertsCount} Alerts</h3>
                <p className="text-xs text-gray-500">Tracking price drops</p>
              </div>

              <div onClick={() => router.push('/basket')} className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                    <span className="material-symbols-outlined">shopping_basket</span>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">Saved</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">My Basket</h3>
                <p className="text-xs text-gray-500">{basketCount} items saved</p>
              </div>


            </div>

            {/* Sub-headline for search */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Find New Deals</h2>
          </div>
        ) : (
          /* Generic Header */
          <div className="flex flex-col items-center justify-center mb-12 text-center w-full max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
              Find the right price, <span className="text-primary">every time.</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
              Search across thousands of verified stores without tracking pixels or hidden ads.
            </p>
          </div>
        )}

        {/* Search Component (Connected to both views) */}
        <div className="w-full relative group z-20">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-white dark:bg-surface-dark rounded-2xl shadow-soft p-2 border border-gray-100 dark:border-gray-700">
            <div className="pl-4 pr-2 text-primary">
              <span className="material-symbols-outlined text-[28px]">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-gray-400 text-gray-900 dark:text-white py-3 outline-none"
              placeholder="Price Does Matter"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {/* 
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  title="Scan Barcode"
                >
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                </button> 
                */}
            <div className="hidden md:flex items-center gap-2 pr-2">
              <button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all transform active:scale-95"
              >
                Search
              </button>
            </div>
          </div>
        </div>
        {/* Filter Chips */}
        <div className="mt-6 w-full overflow-x-auto pb-2 no-scrollbar">
          <div className="flex gap-3 justify-center min-w-max px-2">
            <button onClick={() => router.push('/search?category=Electronics')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full hover:border-primary/50 hover:shadow-md transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-xl">devices</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Electronics</span>
            </button>
            <button onClick={() => router.push('/search?category=Home')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full hover:border-primary/50 hover:shadow-md transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-xl">chair</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Home</span>
            </button>
            <button onClick={() => router.push('/search?category=Fashion')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full hover:border-primary/50 hover:shadow-md transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-xl">styler</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Fashion</span>
            </button>
            <button onClick={() => router.push('/search?category=Sports')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full hover:border-primary/50 hover:shadow-md transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-xl">sports_soccer</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Sports</span>
            </button>
            <button onClick={() => router.push('/search?category=Auto')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full hover:border-primary/50 hover:shadow-md transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-xl">directions_car</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Auto</span>
            </button>
          </div>
        </div>
        {/* Recent Searches Section */}
        {/* Recent Search History */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Pick Up Where You Left Off
            </h3>
            <button
              onClick={() => router.push('/history')}
              className="text-sm font-semibold text-primary hover:bg-primary/10 px-4 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-1">
              View History
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(item.query)}`)}
                  className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image
                          alt={item.topResultTitle || item.query}
                          className="object-contain mix-blend-multiply dark:mix-blend-normal"
                          src={item.image}
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">search</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {item.topResultTitle || item.query}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                          ? `Checked today at ${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : `Checked on ${new Date(item.timestamp).toLocaleDateString()}`}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-400">
                        {item.price && <span className="text-gray-900 dark:text-white font-bold">{item.price}</span>}
                        {!item.price && (
                          <>
                            <span className="material-symbols-outlined text-[14px]">history</span>
                            <span>Resume search</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">history_toggle_off</span>
              <p className="text-gray-500">Your recent searches will appear here.</p>
            </div>
          )}
        </section>
        {/* Popular / Trending Smart Buys */}
        {/* Trending Smart Buys (Real Data) */}
        <section id="trending">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                Trending Smart Buys
              </h3>
              <p className="text-sm text-gray-500 mt-1">Products at their historic low right now.</p>
            </div>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : trendingProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <TrendingCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Unable to load trending deals at the moment.
            </div>
          )}

          {/* View More Button */}
          {trendingProducts.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => router.push('/search?q=Trending Deals')}
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                View More Trending Deals
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </section>
        <footer className="mt-auto pt-16 pb-8 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-6 mb-4">
            <button className="hover:text-primary">About</button>
            <button className="hover:text-primary">Privacy Policy</button>
            <button className="hover:text-primary">Terms of Service</button>
          </div>
          <p>© 2024 TrustBuy Inc. No tracking. No ads. Just truth.</p>
        </footer>
      </div>
    </main >
  );
}
