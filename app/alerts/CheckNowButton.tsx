"use client";

import { useState, useEffect } from "react";
import { refreshAlerts } from "./actions";

export function CheckNowButton({ count }: { count: number }) {
    const [loading, setLoading] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const handleCheck = async () => {
        setLoading(true);
        try {
            const res = await refreshAlerts();
            if (res.success) {
                setLastChecked(new Date());

                // Show notification if products dropped
                if (res.droppedProducts && res.droppedProducts.length > 0) {
                    if (Notification.permission === "granted") {
                        res.droppedProducts.forEach(title => {
                            new Notification("Price Drop Alert!", {
                                body: `Great news! The price for "${title}" has dropped. Check it out now!`,
                                icon: "/favicon.ico" // assuming standard nextjs favicon
                            });
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Failed to check prices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Request notification permission on mount
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // Run check immediately on mount
        if (count > 0) {
            handleCheck();
        }

        // Set up 5-minute interval
        const intervalId = setInterval(() => {
            if (count > 0) {
                handleCheck();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(intervalId);
    }, [count]);

    if (count === 0) return null;

    return (
        <div className="flex flex-col items-center gap-2 w-full md:w-auto">
            <button
                onClick={handleCheck}
                disabled={loading}
                className="w-full md:w-auto px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <span className="material-symbols-outlined">sync</span>
                )}
                {loading ? "Checking Market..." : "Check Now"}
            </button>
            {lastChecked && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-fade-in">
                    Updated!
                </span>
            )}
        </div>
    );
}
