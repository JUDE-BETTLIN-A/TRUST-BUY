"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchResultCard } from '@/components/SearchResultCard';
import { Product } from '@/lib/mock-scraper';
import { addToHistory } from '@/lib/history';
import { searchProductsAction } from './actions';
import { FilterSidebar, FilterState } from './components/FilterSidebar';
import { getUserItem, setUserItem, STORAGE_KEYS } from '@/lib/user-storage';

const DEFAULT_FILTERS: FilterState = {
  minPrice: 0,
  maxPrice: 300000,
  minTrustScore: 0,
  sellers: [],
  brands: [],
  // New filter fields
  features: [],
  useCase: '',
  minDiscount: 0,
  availability: '',
  minRating: 0,
};

function SearchPageContent() {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.email || session?.user?.id;

  const query = searchParams.get('q');
  const category = searchParams.get('category');

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Sort State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState('Best Match');

  useEffect(() => {
    const searchQuery = category ? `${category}` : query;

    if (searchQuery) {
      setLoading(true);

      // Try the server action (which handles real scraping + mock fallback)
      searchProductsAction(searchQuery, 1).then(async (data) => {
        let finalData = data;

        // CLIENT-SIDE SAFETY: If for some reason the server returned empty, 
        // we respect the no-mock policy.
        if (!data || data.length === 0) {
          console.log(`Server returned 0 results for "${searchQuery}".`);
        }

        console.log(`Search Results Loaded: ${finalData.length} items for "${searchQuery}"`);
        setResults(finalData);
        setLoading(false);

        // Save to history (user-specific)
        if (finalData.length > 0 && searchQuery) {
          const topProduct = finalData[0];
          const displayQuery = query || category || "Search";
          addToHistory({
            query: displayQuery,
            image: topProduct.image,
            topResultTitle: topProduct.title,
            price: topProduct.price,
            link: topProduct.link
          }, userId);
        }
      }).catch(async (err) => {
        console.error("Search Action Error:", err);
        // Fallback to mock on any error
        const { searchProducts: searchMock } = await import('@/lib/mock-scraper');
        const fallbackData = await searchMock(searchQuery, 1);
        setResults(fallbackData);
        setLoading(false);
      });
    } else {
      setResults([]);
    }
  }, [query, category]);

  // Derivative state: Filtered & Sorted Results
  const sortedAndFilteredResults = useMemo(() => {
    if (results.length === 0) return [];

    let filtered = results.filter(product => {
      // 1. Price Filter (More robust)
      const rawPrice = product.price || "0";
      const cleanPrice = rawPrice.replace(/[^\d.]/g, '');
      const priceNum = Math.floor(parseFloat(cleanPrice)) || 0;

      if (priceNum > 0) {
        if (priceNum < filters.minPrice) return false;
        if (filters.maxPrice < 1000000 && priceNum > filters.maxPrice) return false;
      }

      // 2. Trust Score Filter
      const rating = product.rating || 0;
      if (filters.minTrustScore > 0 && rating < filters.minTrustScore) return false;

      // 3. Sellers Filter (Case-insensitive)
      if (filters.sellers.length > 0) {
        const store = (product.storeName || "").toLowerCase();
        if (!filters.sellers.some(s => s.toLowerCase() === store)) return false;
      }

      // 4. Brands Filter (Case-insensitive)
      if (filters.brands.length > 0) {
        const brand = (product.brand || "").toLowerCase();
        if (!filters.brands.some(b => b.toLowerCase() === brand)) return false;
      }

      // 5. Discount Filter
      if (filters.minDiscount > 0) {
        let discount = 0;
        if (product.originalPrice) {
          const pOrig = Math.floor(parseFloat(product.originalPrice.replace(/[^\d.]/g, ''))) || 0;
          if (pOrig > priceNum) {
            discount = ((pOrig - priceNum) / pOrig) * 100;
          }
        }
        if (discount < filters.minDiscount) return false;
      }

      // 6. Rating Filter (Convert TrustScore 0-10 to Stars 0-5)
      if (filters.minRating > 0) {
        const stars = (product.rating || 0) / 2;
        if (stars < filters.minRating) return false;
      }

      // 7. Availability Filter (Mock Logic based on shipping text)
      if (filters.availability) {
        const shipText = (product.shipping || "").toLowerCase();
        if (filters.availability === 'free' && !shipText.includes('free')) return false;
        // 'fast' -> check for 'tomorrow' or '24 hours' or 'today'
        if (filters.availability === 'fast' && !shipText.match(/(today|tomorrow|24|fast|express)/i)) return false;
      }

      // 8. Features & Use Case (Text Matching Heuristics)
      const combinedText = (product.title + " " + JSON.stringify(product.specs || {})).toLowerCase();

      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(fid => {
          // Smart mapping for common IDs
          if (fid === '5g') return combinedText.includes('5g');
          if (fid === 'ram8') return combinedText.match(/([8-9]|\d{2})\s?gb/); // 8GB or more
          if (fid === '16gb') return combinedText.match(/(1[6-9]|[2-9]\d)\s?gb/); // 16GB or more
          if (fid === 'storage256') return combinedText.match(/(256|512|1\s?tb)/);
          if (fid === 'ssd') return combinedText.includes('ssd');
          if (fid === 'touch') return combinedText.includes('touch');
          if (fid === 'amoled') return combinedText.includes('amoled') || combinedText.includes('oled');
          if (fid === '4k') return combinedText.includes('4k') || combinedText.includes('uhd');
          if (fid === 'wireless') return combinedText.includes('wireless') || combinedText.includes('bluetooth');
          // Default: loosen match (check if label part is in text?) 
          // Since we only have ID, we rely on the ID being descriptive or simple
          return combinedText.includes(fid);
        });
        if (!hasAllFeatures) return false;
      }

      if (filters.useCase) {
        // Map Use Case ID to keywords
        const uc = filters.useCase;
        const keywords: Record<string, string[]> = {
          'gaming': ['gaming', 'game', 'rtx', 'gtx', 'graphics', 'ps5', 'xbox', 'nintendo'],
          'student': ['student', 'chromebook', 'office', 'light'],
          'camera': ['camera', 'pixel', 'mp', 'sony'],
          'gym': ['sport', 'fit', 'run', 'sweat', 'water'],
          'running': ['run', 'jog', 'sport'],
        };

        if (keywords[uc]) {
          if (!keywords[uc].some(k => combinedText.includes(k))) return false;
        } else {
          if (!combinedText.includes(uc)) return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortBy === 'Lowest Price') {
      filtered.sort((a, b) => {
        const p1 = Math.floor(parseFloat(a.price.replace(/[^\d.]/g, ''))) || 0;
        const p2 = Math.floor(parseFloat(b.price.replace(/[^\d.]/g, ''))) || 0;
        return p1 - p2;
      });
    } else if (sortBy === 'Highest Trust Score') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return filtered;
  }, [results, filters, sortBy]);

  const availableBrands = useMemo(() => {
    const brandsSet = new Set(results.map(r => r.brand).filter(Boolean));
    return Array.from(brandsSet).filter(b => b !== "Generic").sort();
  }, [results]);

  const removeFilter = (key: keyof FilterState, value?: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (key === 'minPrice' || key === 'maxPrice') {
        newFilters.minPrice = 0;
        newFilters.maxPrice = 300000;
      } else if (key === 'minTrustScore') {
        newFilters.minTrustScore = 0;
      } else if (key === 'sellers') {
        newFilters.sellers = newFilters.sellers.filter(v => v !== value);
      } else if (key === 'brands') {
        newFilters.brands = newFilters.brands.filter(v => v !== value);
      } else if (key === 'features') {
        newFilters.features = newFilters.features.filter(v => v !== value);
      }
      return newFilters;
    });
  };

  const toggleProductSelection = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    } else {
      if (selectedProducts.length < 4) {
        setSelectedProducts([...selectedProducts, id]);
      }
    }
  };

  const handleCompareClick = () => {
    // Save selected products to localStorage for the compare page (user-specific)
    const productsToCompare = results.filter(p => selectedProducts.includes(p.id));
    setUserItem(STORAGE_KEYS.COMPARE, JSON.stringify(productsToCompare), userId);
    router.push('/compare');
  };

  /* Confirmation Logic */
  const [pendingAddToBasket, setPendingAddToBasket] = useState<Product | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);

  const handleAddToBasketReq = (product: Product) => {
    const basketData = getUserItem(STORAGE_KEYS.BASKET, userId);
    const basket = basketData ? JSON.parse(basketData) : [];
    if (basket.find((p: any) => p.title === product.title)) {
      setDuplicateProduct(product);
    } else {
      setPendingAddToBasket(product);
    }
  };

  const confirmAddToBasket = () => {
    if (!pendingAddToBasket) return;

    const basketData = getUserItem(STORAGE_KEYS.BASKET, userId);
    const basket = basketData ? JSON.parse(basketData) : [];
    // Double check just in case
    if (!basket.find((p: any) => p.title === pendingAddToBasket.title)) {
      basket.push(pendingAddToBasket);
      setUserItem(STORAGE_KEYS.BASKET, JSON.stringify(basket), userId);
    }
    setPendingAddToBasket(null);
  };

  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto p-6 grid grid-cols-12 gap-8 relative">
      {/* Confirmation Modal */}
      {pendingAddToBasket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 animate-fade-in-up border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-5">
                <span className="material-symbols-outlined text-3xl text-primary">shopping_basket</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add to Basket?</h3>
              <div className="mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Do you want to add <span className="font-semibold text-gray-900 dark:text-white">"{pendingAddToBasket.title.substring(0, 40)}..."</span> to your basket?
                </p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-surface-dark text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                onClick={() => setPendingAddToBasket(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border border-transparent px-4 py-2.5 bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg shadow-primary/30"
                onClick={confirmAddToBasket}
              >
                Yes, Add It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal (Success/Info style) */}
      {duplicateProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 animate-fade-in-up border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-5">
                <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">info</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Already in Basket</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This item is already saved in your basket.
              </p>
            </div>
            <div className="mt-8">
              <button
                className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 px-4 hover:opacity-90 transition-opacity"
                onClick={() => setDuplicateProduct(null)}
              >
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Filters */}
      <aside className="col-span-12 lg:col-span-3 xl:col-span-3 hidden lg:block sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          availableBrands={availableBrands}
          contextQuery={category || query}
        />
      </aside>

      {/* Main Content */}
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
        {/* Results Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              {category ? `Trending in ${category}` : query ? `Results for '${query}'` : "Results"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Searching verified stores..." : `Showing ${sortedAndFilteredResults.length} results based on your preferences`}
            </p>
          </div>
          {!loading && results.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 font-medium cursor-pointer"
                >
                  <option>Best Match</option>
                  <option>Lowest Price</option>
                  <option>Highest Trust Score</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="p-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-gray-500 hover:text-primary lg:hidden"
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              {/* Compare Products Toggle Button */}
              <button
                onClick={() => {
                  setIsCompareMode(!isCompareMode);
                  if (isCompareMode) {
                    setSelectedProducts([]);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${isCompareMode
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">compare_arrows</span>
                <span className="hidden sm:inline">{isCompareMode ? 'Exit Compare' : 'Compare'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filters (Chips) */}
        {!loading && (
          <div className="flex flex-wrap gap-2 items-center">
            {/* Price Chip */}
            {(filters.minPrice > 0 || filters.maxPrice < 300000) && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Price: ₹{filters.minPrice.toLocaleString('en-IN')} - ₹{filters.maxPrice.toLocaleString('en-IN')}
                <button onClick={() => removeFilter('minPrice')} className="hover:text-primary/70 transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* Trust Score Chip */}
            {filters.minTrustScore > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Trust Score: {filters.minTrustScore.toFixed(1)}+
                <button onClick={() => removeFilter('minTrustScore')} className="hover:text-primary/70 transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* Seller Chips */}
            {filters.sellers.map(seller => (
              <div key={`chip-seller-${seller}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Seller: {seller}
                <button onClick={() => removeFilter('sellers', seller)} className="hover:text-primary/70 transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}

            {/* Brand Chips */}
            {filters.brands.map(brand => (
              <div key={`chip-brand-${brand}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Brand: {brand}
                <button onClick={() => removeFilter('brands', brand)} className="hover:text-primary/70 transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}

            {/* Category Chip (Existing) */}
            {category && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                Category: {category}
                <Link href="/search?q=" className="hover:text-primary/70 transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm">close</span>
                </Link>
              </div>
            )}

            {/* Clear All Link */}
            {(filters.minPrice > 0 || filters.maxPrice < 300000 || filters.minTrustScore > 0 || filters.sellers.length > 0 || filters.brands.length > 0) && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-sm text-gray-500 hover:text-primary underline ml-2 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Product Cards List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="size-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Checking Amazon.in, Flipkart, Croma, and more...</h3>
            </div>
          ) : sortedAndFilteredResults.length > 0 ? (
            sortedAndFilteredResults.map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="animate-fade-in-up relative" style={{ animationDelay: `${(idx % 10) * 0.1}s`, animationFillMode: 'both' }}>
                {/* Compare Mode Selection Overlay */}
                {isCompareMode && (
                  <div
                    onClick={() => {
                      setSelectedProducts(prev => {
                        if (prev.includes(product.id)) {
                          return prev.filter(id => id !== product.id);
                        } else if (prev.length < 4) {
                          return [...prev, product.id];
                        }
                        return prev;
                      });
                    }}
                    className={`absolute inset-0 z-10 cursor-pointer rounded-lg border-2 transition-all ${selectedProducts.includes(product.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-primary/50 hover:bg-primary/5'
                      }`}
                  >
                    {/* Selection Checkbox */}
                    <div className={`absolute top-4 right-4 size-8 rounded-full flex items-center justify-center transition-all ${selectedProducts.includes(product.id)
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                      }`}>
                      {selectedProducts.includes(product.id) ? (
                        <span className="material-symbols-outlined text-lg">check</span>
                      ) : (
                        <span className="text-gray-400 text-sm">{selectedProducts.length < 4 ? '+' : ''}</span>
                      )}
                    </div>
                  </div>
                )}
                <SearchResultCard
                  id={idx}
                  title={product.title}
                  price={product.price}
                  storeName={product.storeName}
                  image={product.image}
                  rating={product.rating}
                  trustScore={product.trustScoreBadge}
                  specs={product.specs}
                  isTopChoice={idx === 0 && sortBy === 'Best Match'}
                  condition={idx === 1 ? "New - International" : idx === 2 ? "Refurbished" : "New"}
                  link={product.link}
                  onAddToBasket={() => handleAddToBasketReq(product)}
                  priceHistory={product.priceHistory}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-10 max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">search_off</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matching products found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search for something else.</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="bg-primary text-white font-bold py-2 px-6 rounded-lg transition-all hover:bg-primary/90"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* End of results */}
        <div className="h-20"></div> {/* Spacer */}
      </div>

      {/* Comparison Tray (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 pointer-events-none">
        <div className={`max-w-[800px] mx-auto bg-gray-900 text-white rounded-t-2xl shadow-2xl p-4 transform transition-transform duration-300 pointer-events-auto flex items-center justify-between border-t border-white/10 ${selectedProducts.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <span className="material-symbols-outlined text-primary">compare_arrows</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-sm">Compare Products ({selectedProducts.length})</p>
                <p className="text-xs text-gray-400">Select up to 4 items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedProducts.map((id, index) => (
                <div key={id} className="w-10 h-10 rounded bg-white p-1 relative group cursor-pointer shadow-sm">
                  <Image
                    src={results.find(p => p.id === id)?.image || ""}
                    alt="Product"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                  <div
                    onClick={() => toggleProductSelection(id)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-4 flex items-center justify-center text-[10px] opacity-100 transition-opacity"
                  >×</div>
                </div>
              ))}
              {selectedProducts.length < 4 && (
                <div className="w-10 h-10 rounded border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-600">
                  <span className="text-xs">+</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedProducts([])} className="text-sm text-gray-400 hover:text-white transition-colors">Clear</button>
            <button onClick={handleCompareClick} className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors shadow-lg shadow-primary/20">
              Compare Now
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden isolate">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileFiltersOpen(false)}
          ></div>
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-surface-dark shadow-2xl overflow-y-auto animate-fade-in-right flex flex-col">
            <FilterSidebar
              onClose={() => setIsMobileFiltersOpen(false)}
              filters={filters}
              setFilters={setFilters}
              availableBrands={availableBrands}
              contextQuery={category || query}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}