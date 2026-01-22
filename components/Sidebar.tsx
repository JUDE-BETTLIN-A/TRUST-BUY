"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    /* Real-time Profile Updates */
    const [userAvatar, setUserAvatar] = useState(session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest");
    const [displayName, setDisplayName] = useState(session?.user?.name || "User");

    useEffect(() => {
        const updateProfile = () => {
            // Update Avatar
            const savedAvatar = localStorage.getItem('trustbuy_user_avatar');
            if (savedAvatar) {
                setUserAvatar(savedAvatar);
            } else if (session?.user?.image) {
                setUserAvatar(session.user.image);
            }

            // Update Name
            const savedName = localStorage.getItem('trustbuy_user_name');
            if (savedName) {
                setDisplayName(savedName);
            } else if (session?.user?.name) {
                setDisplayName(session.user.name);
            }
        };

        // Initial load
        updateProfile();

        // Listen for updates
        window.addEventListener('trustbuy_avatar_update', updateProfile);
        window.addEventListener('trustbuy_profile_update', updateProfile);

        return () => {
            window.removeEventListener('trustbuy_avatar_update', updateProfile);
            window.removeEventListener('trustbuy_profile_update', updateProfile);
        };
    }, [session]);

    // Don't show sidebar on landing page or auth pages
    if (pathname === "/" || pathname?.startsWith("/auth")) {
        return null;
    }

    return (
        <aside className="hidden md:flex flex-col w-64 bg-surface-light dark:bg-surface-dark h-full flex-shrink-0 z-20">
            <div className="p-6 pb-2">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-xl">shield_lock</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">TrustBuy</h1>
                        <p className="text-xs text-primary font-medium mt-0.5">Privacy First</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-1">
                    <Link
                        href="/home"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary transition-all duration-200"
                    >
                        <span className="material-symbols-outlined filled">home</span>
                        <span className="text-sm font-semibold">Home</span>
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">compare_arrows</span>
                        <span className="text-sm font-medium">Compare</span>
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">pie_chart</span>
                        <span className="text-sm font-medium">Budget</span>
                    </Link>
                    <Link
                        href="/alerts"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">notifications</span>
                        <span className="text-sm font-medium">Alerts</span>
                    </Link>
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">settings</span>
                        <span className="text-sm font-medium">Settings</span>
                    </Link>
                </nav>
            </div>
            <div className="mt-auto p-6 border-t border-gray-100 dark:border-gray-800">
                {session?.user && (
                    <Link href="/settings" className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:shadow-sm cursor-pointer transition-shadow">
                        <Image
                            alt="Profile avatar showing a smiling person"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            src={userAvatar}
                            width={40}
                            height={40}
                        />
                        <div className="flex flex-col min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white break-words leading-tight">{displayName}</p>
                        </div>
                    </Link>
                )}
            </div>
        </aside>
    );
}
