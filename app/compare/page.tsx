"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TopNavbar } from '@/components/TopNavbar';

export default function ComparePage() {
  const [removedItems, setRemovedItems] = useState<number[]>([]);

  const handleRemove = (index: number) => {
    setRemovedItems([...removedItems, index]);
  };

  const isRemoved = (index: number) => removedItems.includes(index);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-text-main dark:text-text-main-dark transition-colors duration-300">

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs & Heading */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/home" className="hover:text-primary">Home</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <Link href="#" className="hover:text-primary">Electronics</Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-900 dark:text-white font-medium">Headphones</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">Comparing {3 - removedItems.length} Items</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl">
                Unbiased analysis based on price, trust score, and long-term value.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-[18px]">share</span>
                Share
              </button>
              <button className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Comparison Header (Product Cards) */}
        <div className="sticky top-[64px] z-40 pb-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm -mx-6 px-6 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-all duration-300">
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-6 items-end pt-4">
            {/* Label Column Header */}
            <div className="hidden md:flex flex-col justify-end pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Attributes</span>
            </div>

            {/* Product 1 */}
            {!isRemoved(0) && (
              <div className="relative group p-4 rounded-xl bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <button onClick={() => handleRemove(0)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
                <div className="h-32 w-full mb-3 flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <Image
                    className="max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJXffKja6PWf2H4mAYaKgO7wZx5GXd8KS4klev6xCigsuUKOhIkK4rUmA3WIrYVVwl_oKMXP32YgJS8-Qc4B_YZ7qZ_bIhC7ePJkp4oeseJAKvmIlUCZY9tAdfKnBeVEnezgp8BY9RInemQZai1DyGxwUVRxamJflD4jtrQ6wLXtCup9MYgAyneAwaKsDvhDdElA8y9kNQ4XVgzD15ZTPJsEvyIU1coCSUILPA2HpPUInHAAjVHaGo5tYt5ZmremPAR95iy8KzOFE"
                    alt="Sony WH-1000XM5 Silver"
                    width={120}
                    height={120}
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white">Sony WH-1000XM5</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">$348</span>
                    <span className="text-xs text-gray-500 line-through">$399</span>
                  </div>
                </div>
              </div>
            )}
            {isRemoved(0) && <div className="hidden md:block"></div>}

            {/* Product 2 (Best Value) */}
            {!isRemoved(1) && (
              <div className="relative group p-4 rounded-xl bg-white dark:bg-card-dark border-2 border-primary/50 shadow-glow transition-all hover:-translate-y-1">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-sm z-10">
                  Top Choice
                </div>
                <button onClick={() => handleRemove(1)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
                <div className="h-32 w-full mb-3 flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <Image
                    className="max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhk_ePdmeFjBrfqG_aDuCuZ-1l3yPxAEt13cH9d4uhztZM0gwTxMZjFGiZuO56qUYgfcXI0w3l7uss0MnxB6_-R5zj2nY2uRlyG9VJMO8d6uHV3Lyt8yjhG6OnAPC8o6jcvk6mUvqBpudl2IjuQwZT9DvYce4E2sib-BeSSvljYtI_yvYOD156vvmeNXHSCXR4VCyG9-ZJeYM2fN4VJR2NxRYFK2_znDMFxNxLtFjNXq74Bhk8WODWdio6qN77VQ6m1T3l4IHMiwk"
                    alt="Sony WH-1000XM5 Black"
                    width={120}
                    height={120}
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white">Sony WH-1000XM5 (Intl)</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">$315</span>
                    <span className="text-xs text-green-600 font-medium">-15% drop</span>
                  </div>
                </div>
              </div>
            )}
            {isRemoved(1) && <div className="hidden md:block"></div>}

            {/* Product 3 */}
            {!isRemoved(2) && (
              <div className="relative group p-4 rounded-xl bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <button onClick={() => handleRemove(2)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
                <div className="h-32 w-full mb-3 flex items-center justify-center p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <Image
                    className="max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDPKr6Kj-q-42Kkj9o6ns2yah8scMmrwuXjJj1xJzYtP9u0CuERvxe_9n-HWy7u8jtnWlQMkg54LIQkid2T7juooKds_lhqsAc-lEDx2MwF23uXt4SvuV4Ata5S5Q_oFelku1VcakekUEJDsaI86pvrozgKEqNRQJwaZlSUQDYm5A7STD-qcMf9EzfbGnYK2ywAOuV_hxLN13-t5TOPs1LJDxnnq3h9dZVMezZGTmICMbT5QbnxgHnddpX9gRY-bzHN4oT1nNKEiM"
                    alt="Sony WH-1000XM5 Refurbished"
                    width={120}
                    height={120}
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight text-gray-900 dark:text-white">Sony WH-1000XM5 (Refurb)</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">$279</span>
                  </div>
                </div>
              </div>
            )}
            {isRemoved(2) && <div className="hidden md:block"></div>}

          </div>
        </div>

        {/* Comparison Table Body */}
        <div className="mt-4 space-y-px bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-b-xl overflow-hidden">
          {/* Row: Trust Score */}
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-px bg-gray-200 dark:bg-gray-800">
            <div className="bg-white dark:bg-card-dark p-4 flex items-center font-medium text-sm text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined mr-2 text-primary text-[20px]">verified_user</span>
              Trust Score
            </div>

            {!isRemoved(0) && (
              <div className="bg-white dark:bg-card-dark p-4 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-1 relative z-10">
                  <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full shadow-[0_0_10px_#4bd8e2]" style={{ width: '98%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-primary">9.8</span>
                </div>
                <span className="text-xs text-primary font-medium relative z-10">Top Rated</span>
              </div>
            )}
            {isRemoved(0) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(1) && (
              <div className="bg-white dark:bg-card-dark p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">8.4</span>
                </div>
                <span className="text-xs text-gray-500">Very Good</span>
              </div>
            )}
            {isRemoved(1) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(2) && (
              <div className="bg-white dark:bg-card-dark p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">9.2</span>
                </div>
                <span className="text-xs text-gray-500">Certified</span>
              </div>
            )}
            {isRemoved(2) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}
          </div>

          {/* Row: Seller */}
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-px bg-gray-200 dark:bg-gray-800">
            <div className="bg-white dark:bg-card-dark p-4 flex items-center font-medium text-sm text-gray-500 dark:text-gray-400">
              Seller
            </div>

            {!isRemoved(0) && (
              <div className="bg-white dark:bg-card-dark p-4 flex items-center gap-3 relative">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">BB</div>
                <div className="text-sm relative z-10">
                  <p className="font-semibold text-gray-900 dark:text-white">BestBuy</p>
                  <p className="text-xs text-gray-500">Pickup Today</p>
                </div>
              </div>
            )}
            {isRemoved(0) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(1) && (
              <div className="bg-white dark:bg-card-dark p-4 flex items-center gap-3">
                <div className="size-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600">GW</div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">GadgetWorld</p>
                  <p className="text-xs text-gray-500">eBay Store</p>
                </div>
              </div>
            )}
            {isRemoved(1) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(2) && (
              <div className="bg-white dark:bg-card-dark p-4 flex items-center gap-3">
                <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">Amz</div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">Amazon</p>
                  <p className="text-xs text-gray-500">Renewed</p>
                </div>
              </div>
            )}
            {isRemoved(2) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}
          </div>

          {/* Row: Specs - Condition */}
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-px bg-gray-200 dark:bg-gray-800 group/row">
            <div className="bg-white dark:bg-card-dark p-4 flex items-center justify-between font-medium text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <span>Condition</span>
              <span className="material-symbols-outlined text-[16px] opacity-0 group-hover/row:opacity-100 transition-opacity">expand_more</span>
            </div>

            {!isRemoved(0) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200 relative">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Brand New
                </span>
              </div>
            )}
            {isRemoved(0) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(1) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  New (Intl)
                </span>
              </div>
            )}
            {isRemoved(1) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(2) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Refurbished
                </span>
              </div>
            )}
            {isRemoved(2) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}
          </div>

          {/* Row: Warranty (Expandable) */}
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-px bg-gray-200 dark:bg-gray-800 group/row">
            <div className="bg-white dark:bg-card-dark p-4 flex items-center justify-between font-medium text-sm text-gray-500 dark:text-gray-400">
              Warranty
            </div>

            {!isRemoved(0) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200 relative">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">1 Year Sony</span>
                  <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                </div>
              </div>
            )}
            {isRemoved(0) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(1) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200">
                <div className="flex items-center gap-1 text-orange-600">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>No US Mfg.</span>
                </div>
              </div>
            )}
            {isRemoved(1) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(2) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200">
                2-Year Allstate
              </div>
            )}
            {isRemoved(2) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}
          </div>

          {/* Row: Delivery */}
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-px bg-gray-200 dark:bg-gray-800">
            <div className="bg-white dark:bg-card-dark p-4 flex items-center font-medium text-sm text-gray-500 dark:text-gray-400">
              Delivery
            </div>

            {!isRemoved(0) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200 relative">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Tomorrow
                </span>
              </div>
            )}
            {isRemoved(0) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(1) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Oct 28 - Nov 2
                </span>
              </div>
            )}
            {isRemoved(1) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}

            {!isRemoved(2) && (
              <div className="bg-white dark:bg-card-dark p-4 text-sm text-gray-900 dark:text-gray-200">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Tue, Oct 24
                </span>
              </div>
            )}
            {isRemoved(2) && <div className="bg-white dark:bg-card-dark hidden md:block"></div>}
          </div>
        </div>

        {/* Sticky Bottom CTA (Mobile/Desktop) */}
        <div className="sticky bottom-4 mt-6 z-30">
          <div className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr_1fr_1fr] gap-6">
            <div className="hidden md:block"></div> {/* Spacer for labels */}

            {!isRemoved(0) && (
              <div className="flex flex-col gap-2">
                <button className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white dark:text-gray-900 font-bold rounded-xl shadow-[0_4px_14px_0_rgba(75,216,226,0.39)] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-2">Buy Now <span className="material-symbols-outlined text-[18px]">shopping_cart</span></span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
                <p className="text-center text-xs text-primary font-medium">Best Value • BestBuy</p>
              </div>
            )}
            {isRemoved(0) && <div className="hidden md:block"></div>}

            {!isRemoved(1) && (
              <div className="flex flex-col gap-2">
                <button className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                  <span>View Deal</span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </button>
                <p className="text-center text-xs text-gray-500">GadgetWorld</p>
              </div>
            )}
            {isRemoved(1) && <div className="hidden md:block"></div>}

            {!isRemoved(2) && (
              <div className="flex flex-col gap-2">
                <button className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2">
                  <span>View Deal</span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </button>
                <p className="text-center text-xs text-gray-500">Amazon</p>
              </div>
            )}
            {isRemoved(2) && <div className="hidden md:block"></div>}

          </div>
        </div>
      </main>
    </div>
  );
}