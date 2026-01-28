"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getUserItem, STORAGE_KEYS } from "@/lib/user-storage";

export function TopNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Detect stale "Guest User" session from old logic and force cleanup
    const isStaleGuest = session?.user?.name === "Guest User";

    // Get user ID for user-specific storage
    const userId = session?.user?.email || session?.user?.id;

    /* Real-time Profile Updates */
    const [userAvatar, setUserAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Guest");
    const [displayName, setDisplayName] = useState("User");

    useEffect(() => {
        if (isStaleGuest) {
            signOut({ redirect: false });
        }
    }, [isStaleGuest]);

    useEffect(() => {
        const updateProfile = () => {
            // Update Avatar (user-specific)
            const savedAvatar = getUserItem(STORAGE_KEYS.AVATAR, userId);
            if (savedAvatar) {
                setUserAvatar(savedAvatar);
            } else if (session?.user?.image) {
                setUserAvatar(session.user.image);
            }

            // Update Name (user-specific)
            const savedName = getUserItem(STORAGE_KEYS.NAME, userId);
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
    }, [session, userId]);

    // Don't show navbar on landing page or auth pages
    // Return null only after mounted to prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    if (pathname === "/" || pathname?.startsWith("/auth")) {
        return null;
    }

    const navLinks = [
        { href: "/home", label: "Home", icon: "home" },
        { href: "/basket", label: "My Basket", icon: "shopping_basket" },
        { href: "/offers", label: "Upcoming Offers", icon: "local_offer" },
        { href: "/alerts", label: "Alerts", icon: "notifications" }
    ];

    return (
        <nav className="w-full bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 z-50 sticky top-0">
            <div className="max-w-[1440px] mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Mobile Hamburger Button */}
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <span className="material-symbols-outlined text-2xl">menu</span>
                        </button>

                        <Link href="/home" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-xl">shield_lock</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">TrustBuy</h1>
                                <p className="text-[10px] text-primary font-medium mt-0.5 uppercase tracking-wider">Privacy First</p>
                            </div>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === link.href
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">{link.icon}</span>
                                        {link.label}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {session?.user && !isStaleGuest ? (
                            <Link href="/settings" className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{displayName}</p>
                                </div>
                                <Image
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                    src={userAvatar}
                                    width={36}
                                    height={36}
                                />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/auth/signin"
                                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors px-2"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 shadow-xl animate-fade-in-down origin-top z-40">
                    <div className="p-4 flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 ${pathname === link.href
                                    ? 'text-primary bg-primary/10'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
