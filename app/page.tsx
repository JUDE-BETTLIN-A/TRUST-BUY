"use client";

import Link from 'next/link';
import { ShieldCheck, TrendingDown, Bell, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">TrustBuy</span>
              <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Privacy First</p>
            </div>
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">About</Link>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 text-center py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI-Powered Price Tracking</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Shop Smarter. <br />
            <span className="text-primary">Never Overpay Again.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your personal shopping assistant that tracks prices, predicts drops, and helps you buy at the perfect moment. Private, secure, and always on your side.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Get Started Free
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              Existing User
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full px-4">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl text-left hover:shadow-lg hover:border-gray-300 transition-all duration-300 group">
            <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingDown className="text-emerald-600 h-6 w-6" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-2">Price Drop Alerts</h3>
            <p className="text-gray-500 text-sm">Get instant notifications when your favorite products hit your target price.</p>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-2xl text-left hover:shadow-lg hover:border-gray-300 transition-all duration-300 group">
            <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bell className="text-amber-600 h-6 w-6" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-2">Smart Reminders</h3>
            <p className="text-gray-500 text-sm">Never miss a sale. We track upcoming events and exclusive deals for you.</p>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-2xl text-left hover:shadow-lg hover:border-gray-300 transition-all duration-300 group">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="text-blue-600 h-6 w-6" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-2">Privacy First</h3>
            <p className="text-gray-500 text-sm">Your shopping data is yours alone. We don't sell your data to third parties.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-gray-200 bg-white">
        <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} TrustBuy Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
