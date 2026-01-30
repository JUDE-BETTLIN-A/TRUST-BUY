"use client";

import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../app/alerts/actions";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationItem {
    id: string;
    alertId: string | null;
    type: string;
    title: string;
    message: string;
    productTitle: string | null;
    oldPrice: number | null;
    newPrice: number | null;
    productImage: string | null;
    productLink: string | null;
    isRead: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Load notifications on mount
    useEffect(() => {
        loadNotifications();
    }, []);

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const loadNotifications = async () => {
        try {
            const result = await getNotifications();
            if (result.success) {
                setNotifications(result.notifications);
                setUnreadCount(result.notifications.filter((n: NotificationItem) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to load notifications:", error);
        }
    };

    const handleMarkRead = async (notificationId: string) => {
        try {
            await markNotificationRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const showWebNotification = (notification: NotificationItem) => {
        if ("Notification" in window && Notification.permission === "granted") {
            const notif = new Notification(notification.title, {
                body: notification.message,
                icon: notification.productImage || "/icon.svg",
                tag: `price-alert-${notification.id}`, // Prevents duplicate notifications
            });

            notif.onclick = () => {
                window.focus();
                if (notification.productLink && notification.productLink !== "#") {
                    window.open(notification.productLink, "_blank");
                }
                notif.close();
            };

            // Auto-close after 5 seconds
            setTimeout(() => notif.close(), 5000);
        }
    };

    // Show web notification for new price drops
    useEffect(() => {
        const unreadPriceDrops = notifications.filter(n => !n.isRead && n.type === 'price_drop');
        unreadPriceDrops.forEach(notification => {
            showWebNotification(notification);
        });
    }, [notifications]);

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined text-2xl">
                    notifications
                </span>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {unreadCount} unread
                        </p>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">
                                    notifications_off
                                </span>
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-dark/50 cursor-pointer ${
                                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            handleMarkRead(notification.id);
                                        }
                                        // Navigate to internal product page instead of external link
                                        if (notification.alertId) {
                                            const productUrl = `/product/${notification.alertId}?title=${encodeURIComponent(notification.productTitle || '')}&price=${encodeURIComponent(notification.newPrice?.toString() || '')}&image=${encodeURIComponent(notification.productImage || '')}&store=${encodeURIComponent('Notification Store')}&link=${encodeURIComponent(notification.productLink || '')}&rating=4.5&originalPrice=${encodeURIComponent(notification.oldPrice?.toString() || '')}`;
                                            router.push(productUrl);
                                        }
                                    }}
                                >
                                    <div className="flex gap-3">
                                        {notification.productImage && (
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={notification.productImage}
                                                    alt={notification.productTitle || ""}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                                                    {notification.title}
                                                </h4>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            {notification.oldPrice && notification.newPrice && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-500 line-through">
                                                        ₹{notification.oldPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        ₹{notification.newPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        {Math.round(((notification.oldPrice - notification.newPrice) / notification.oldPrice) * 100)}% off
                                                    </span>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowDropdown(false)}
                                className="w-full text-sm text-primary hover:text-primary/80 font-medium"
                            >
                                View All
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}