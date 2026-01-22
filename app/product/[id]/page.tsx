"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductSummaryCard } from '@/components/ProductSummaryCard';

export default function ProductPage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch product data using params.id
  // For now, we'll hardcode the Sony headphones data from the HTML

  return (
    <div className="flex-1 w-full max-w-[960px] mx-auto px-4 md:px-6 py-8 flex flex-col">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/home" className="text-gray-500 text-text-secondary hover:text-primary transition-colors">Home</Link>
        <span className="text-gray-400 text-text-secondary/50">/</span>
        <Link href="/watchlist" className="text-gray-500 text-text-secondary hover:text-primary transition-colors">Watchlist</Link>
        <span className="text-gray-400 text-text-secondary/50">/</span>
        <span className="font-semibold text-gray-900 text-text-main dark:text-white">Sony WH-1000XM5</span>
      </div>

      {/* Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 text-text-main dark:text-white mb-2">Configure Budget Guardian</h1>
          <p className="text-gray-500 text-text-secondary dark:text-gray-400 text-base max-w-xl">
            Set your "right price" and let TrustBuy monitor 50+ retailers 24/7. We'll secure the deal the moment it drops.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Best Price Guarantee Active</span>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 border-border-light dark:border-border-dark shadow-sm overflow-hidden flex flex-col">
        {/* Product Summary Header */}
        <ProductSummaryCard
          title="Sony WH-1000XM5 Wireless Noise Canceling Headphones"
          price="$348.00"
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuB7zOzqNJV3kZUKM6gEtT3Yv8WI6l6LnfD675w7pmBj0mo5nobbnEq9jrfFksxH2GsXu-9-xdPS3vcFsum2dYS9uL80JvVIa2_4KK1dwDedOQkisyH68PaU2qSf9ZOXF42KkePdtdwugfGK4xhDmNTd249cQbc2jKMkwS3CRhBHSLK0o0VzxkfuGD2ExlzGabfL27qGOQeA-w2U4Tfu60kiDS7tRhiGwoCpbk5LT5RhTorNSugZTMjZijeV44luHBgezFFsYoMUWQc"
          model="WH1000XM5/B"
          category="Electronics"
          bestPrice={true}
        />

        {/* Configuration Body */}
        <div className="p-6 md:p-8 space-y-10">
          {/* Budget Input Section */}
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 pt-2">
              <label className="block text-base font-bold text-gray-900 text-text-main dark:text-white mb-2">Target Budget</label>
              <p className="text-sm text-gray-500 text-text-secondary leading-relaxed">
                Enter the maximum amount you are willing to pay including estimated tax.
              </p>
            </div>
            <div className="md:col-span-8">
              <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-text-secondary text-2xl font-light">$</span>
                </div>
                <input
                  className="block w-full pl-10 pr-4 py-4 bg-gray-50 bg-background-light dark:bg-background-dark border-gray-200 border-border-light dark:border-border-dark rounded-lg text-3xl font-bold text-gray-900 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-300 dark:placeholder-gray-600 shadow-inner appearance-none"
                  placeholder="0.00"
                  type="number"
                  defaultValue="320.00"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-text-secondary text-base font-medium">USD</span>
                </div>
              </div>
              {/* Dynamic Feedback */}
              <div className="mt-4 flex items-start gap-3 p-3 rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] mt-0.5">info</span>
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">Moderate Target</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                    Your target is <span className="font-bold">$28.00 (8%)</span> below the current market price. Based on price history, this is likely to trigger within 14 days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 border-border-light dark:border-border-dark" />

          {/* Guardian Status Toggle */}
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4">
              <label className="block text-base font-bold text-gray-900 text-text-main dark:text-white mb-1">Guardian Status</label>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Monitoring Active</span>
              </div>
            </div>
            <div className="md:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 border-border-light dark:border-border-dark bg-gray-50 bg-background-light dark:bg-background-dark/50 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">radar</span>
                  </div>
                  <div>
                    <p className="text-gray-900 text-text-main dark:text-white font-semibold">Enable Price Monitoring</p>
                    <p className="text-sm text-gray-500 text-text-secondary">TrustBuy will notify you when price meets target.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 border-border-light dark:border-border-dark" />

          {/* Notification Methods */}
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 pt-1">
              <label className="block text-base font-bold text-gray-900 text-text-main dark:text-white mb-2">Alert Methods</label>
              <p className="text-sm text-gray-500 text-text-secondary">How should we reach you?</p>
            </div>
            <div className="md:col-span-8 flex flex-col gap-3">
              <label className="flex items-center gap-3 p-3 rounded border border-transparent hover:bg-gray-50 hover:bg-background-light dark:hover:bg-white/5 transition-colors cursor-pointer">
                <input defaultChecked className="size-5 rounded border-gray-300 text-primary focus:ring-primary" type="checkbox" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-text-secondary text-[20px]">mail</span>
                    <span className="text-gray-900 text-text-main dark:text-white font-medium">Email Notification</span>
                  </div>
                  <p className="text-xs text-gray-500 text-text-secondary mt-0.5 ml-7">Send to a******@gmail.com</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded border border-transparent hover:bg-gray-50 hover:bg-background-light dark:hover:bg-white/5 transition-colors cursor-pointer">
                <input defaultChecked className="size-5 rounded border-gray-300 text-primary focus:ring-primary" type="checkbox" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-text-secondary text-[20px]">notifications_active</span>
                    <span className="text-gray-900 text-text-main dark:text-white font-medium">In-App &amp; Push</span>
                  </div>
                  <p className="text-xs text-gray-500 text-text-secondary mt-0.5 ml-7">Instant notification to your devices</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-gray-50 bg-background-light dark:bg-[#1a1d21] border-t border-gray-200 border-border-light dark:border-border-dark flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
          <button className="w-full sm:w-auto px-6 py-2.5 rounded text-sm font-semibold text-gray-500 text-text-secondary hover:text-gray-900 hover:text-text-main dark:hover:text-white transition-colors">
            Cancel
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-primary hover:bg-primary/90 hover:bg-primary-dark text-white text-sm font-semibold shadow-sm shadow-primary/30 transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Configuration
          </button>
        </div>
      </div>

      {/* Summary Analysis Section */}


      {/* History/Context Footer */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
        <div className="p-4 rounded border border-transparent hover:border-gray-200 hover:border-border-light dark:hover:border-border-dark transition-colors">
          <p className="text-gray-400 text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">Lowest Price (30d)</p>
          <p className="text-gray-900 text-text-main dark:text-white font-bold text-lg">$329.99</p>
          <p className="text-xs text-gray-500 text-text-secondary">Oct 12, 2023</p>
        </div>
        <div className="p-4 rounded border border-transparent hover:border-gray-200 hover:border-border-light dark:hover:border-border-dark transition-colors md:border-l md:border-r dark:border-gray-800 dark:border-border-dark">
          <p className="text-gray-400 text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">Average Price</p>
          <p className="text-gray-900 text-text-main dark:text-white font-bold text-lg">$348.00</p>
          <p className="text-xs text-gray-500 text-text-secondary">Stable Trend</p>
        </div>
        <div className="p-4 rounded border border-transparent hover:border-gray-200 hover:border-border-light dark:hover:border-border-dark transition-colors">
          <p className="text-gray-400 text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">Retailers Tracked</p>
          <p className="text-gray-900 text-text-main dark:text-white font-bold text-lg">52 Stores</p>
          <div className="flex items-center justify-center md:justify-start -space-x-2 mt-1">
            <div className="size-5 rounded-full bg-gray-200 border border-white"></div>
            <div className="size-5 rounded-full bg-gray-300 border border-white"></div>
            <div className="size-5 rounded-full bg-gray-400 border border-white"></div>
            <div className="size-5 rounded-full bg-primary text-[8px] text-white flex items-center justify-center border border-white font-bold">+49</div>
          </div>
        </div>
      </div>
    </div>
  );
}
