"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Shield, Moon, Wifi, Info } from 'lucide-react'; // Added Wallet icon
import { signOut } from "next-auth/react";


/* New Imports */
import { User } from 'lucide-react';
import { AvatarSelector } from '@/components/profile/AvatarSelector';
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {

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



  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings & Preferences</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your notifications, privacy, and app behavior.
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