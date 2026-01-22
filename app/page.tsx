"use client";

import Link from 'next/link';
import { ShieldCheck, TrendingDown, Bell, Lock } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex flex-col">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] rounded-full bg-purple-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] transform -translate-x-1/2 -translate-y-1/2 w-[30vh] h-[30vh] rounded-full bg-fuchsia-600/10 blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 w-full px-6 py-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
            <ShieldCheck className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            TrustBuy
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-white/70">
          <Link href="#" className="hover:text-white transition-colors">Features</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">About</Link>
        </div>
        <div className="flex gap-4">
          <Link
            href="/auth/signin"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 text-center mt-12 md:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-white/80 tracking-wide uppercase">AI-Powered Price Tracking</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 max-w-4xl leading-tight">
          Shop Smarter. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient-x">
            Never Overpay Again.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
          Your personal shopping assistant that tracks prices, predicts drops, and helps you buy at the perfect moment. Private, secure, and always on your side.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/auth/signup"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-2"
          >
            Get Started Free
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <Link
            href="/auth/signin"
            className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all transform hover:-translate-y-1 flex items-center justify-center"
          >
            Existing User
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all duration-300 group">
            <div className="bg-gradient-to-br from-green-400/20 to-green-600/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingDown className="text-green-400 h-6 w-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Price Drop Alerts</h3>
            <p className="text-white/50 text-sm">Get instant notifications when your favorite products hit your target price.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all duration-300 group">
            <div className="bg-gradient-to-br from-amber-400/20 to-red-600/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bell className="text-amber-400 h-6 w-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Smart Reminders</h3>
            <p className="text-white/50 text-sm">Never miss a sale. We track upcoming events and exclusive deals for you.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all duration-300 group">
            <div className="bg-gradient-to-br from-blue-400/20 to-purple-600/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="text-blue-400 h-6 w-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Privacy First</h3>
            <p className="text-white/50 text-sm">Your shopping data is yours alone. We don't sell your data to third parties.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center text-white/20 text-sm">
        <p>&copy; {new Date().getFullYear()} TrustBuy Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
