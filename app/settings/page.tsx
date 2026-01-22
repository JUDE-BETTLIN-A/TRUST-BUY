"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Shield, Moon, Wifi, Info, Wallet } from 'lucide-react'; // Added Wallet icon
import { signOut } from "next-auth/react";
import { getAgentConfig, depositToWallet } from "../agent/actions";

/* New Imports */
import { User } from 'lucide-react';
import { AvatarSelector } from '@/components/profile/AvatarSelector';
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [walletBalance, setWalletBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadWallet();
    // Load Avatar
    const savedAvatar = localStorage.getItem('trustbuy_user_avatar');
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    } else if (session?.user?.image) {
      setUserAvatar(session.user.image);
    }

    // Load Name
    const savedName = localStorage.getItem('trustbuy_user_name');
    if (savedName) {
      setUserName(savedName);
    } else if (session?.user?.name) {
      setUserName(session.user.name);
    }
  }, [session]);

  const handleSaveProfile = (newUrl: string, newName?: string) => {
    if (newUrl) {
      setUserAvatar(newUrl);
      localStorage.setItem('trustbuy_user_avatar', newUrl);
    }

    if (newName) {
      setUserName(newName);
      localStorage.setItem('trustbuy_user_name', newName);
    }

    // Dispatch custom event for immediate UI update bundle
    window.dispatchEvent(new Event('trustbuy_profile_update'));
    window.dispatchEvent(new Event('trustbuy_avatar_update'));
  };

  const loadWallet = async () => {
    const config = await getAgentConfig();
    if (config) {
      setWalletBalance(config.walletBalance || 0);
    }
  };

  const handleDeposit = async () => {
    await depositToWallet(depositAmount);
    loadWallet();
    setDepositAmount(5000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings & Preferences</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your notifications, privacy, account balance, and app behavior.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Customization */}
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Digital Identity
            </CardTitle>
            <CardDescription>
              Customize how you appear across TrustBuy. Choose a generated style or upload your own.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarSelector
              currentAvatar={userAvatar}
              onSave={handleSaveProfile}
              userName={userName || session?.user?.name || "User"}
            />
          </CardContent>
        </Card>
        {/* Wallet & Payments (Moved from Agent Page) */}
        <div id="wallet" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-5 h-5 text-blue-200" />
                <p className="text-blue-100 text-sm font-medium">TrustBuy Wallet</p>
              </div>
              <h3 className="text-4xl font-bold">₹{walletBalance.toLocaleString()}</h3>
              <p className="text-sm text-blue-100/80 mt-1">Available for Agent Auto-Buy</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2 block">Add Funds</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">₹</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white placeholder-white/30 outline-none focus:bg-black/30 transition-colors"
                />
              </div>
              <button
                onClick={handleDeposit}
                className="bg-white text-blue-700 font-bold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-lg active:scale-95 transform"
              >
                + Add Funds
              </button>
            </div>
          </div>
        </div>


        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5" /> Notifications
            </CardTitle>
            <CardDescription>Control what alerts you receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="price-drop" className="flex-1">Price Drop Alerts</Label>
              <Switch id="price-drop" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="budget-hit" className="flex-1">Budget Hit Notifications</Label>
              <Switch id="budget-hit" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="promos" className="flex-1">Promotional Alerts</Label>
              <Switch id="promos" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5" /> Privacy & Data
            </CardTitle>
            <CardDescription>How we handle your information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics" className="flex-1">Anonymous Analytics</Label>
              <Switch id="analytics" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="history" className="flex-1">Save Search History</Label>
              <Switch id="history" />
            </div>
            <div className="pt-2">
              <Button variant="outline" className="w-full md:w-auto">
                View Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Moon className="w-5 h-5" /> Appearance & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex-1">Dark Mode</Label>
              <Switch id="dark-mode" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lite-mode" className="flex-1">Lite Mode (Low Bandwidth)</Label>
              <Switch id="lite-mode" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="images" className="flex-1">Load Images</Label>
              <Switch id="images" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Info className="w-5 h-5" /> About
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>TrustBuy v1.0.0</p>
            <p>Build: 2026.01.08</p>
            <p>Privacy-First • No Ads • No Tracking</p>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
          <Button variant="ghost" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}