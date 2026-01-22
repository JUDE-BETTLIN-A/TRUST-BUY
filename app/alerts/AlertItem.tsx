"use client";

import { useState } from "react";
import Image from "next/image";
import { removeAlert } from "./actions";
import { AgentDelegateModal } from "./AgentDelegateModal";

interface AlertProps {
    id: string;
    productTitle: string;
    targetPrice: number;
    currentPrice: number;
    productImage: string;
    productLink: string;
    hidePriceDetails?: boolean;
}

interface AlertItemProps {
    alert: AlertProps;
    hidePriceDetails?: boolean;
}

export function AlertItem({ alert, hidePriceDetails }: AlertItemProps) {
    const [removed, setRemoved] = useState(false);
    const [isDelegateOpen, setIsDelegateOpen] = useState(false);

    const handleRemove = async () => {
        setRemoved(true);
        // Optimistically remove from UI, then sync with server
        try {
            await removeAlert(alert.id);
        } catch (e) {
            console.error("Failed to delete alert", e);
            // Optionally revert if failed, but for now we assume success
        }
    };

    if (removed) return null;

    // Mock checking price (in a real app, this would be computed on server)
    const isDrop = alert.currentPrice < alert.targetPrice;
    const dropPercent = isDrop
        ? Math.round(((alert.targetPrice - alert.currentPrice) / alert.targetPrice) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-all">
            <div className="size-20 shrink-0 bg-gray-50 dark:bg-white/5 rounded-lg p-2 flex items-center justify-center">
                <Image
                    src={alert.productImage}
                    alt={alert.productTitle}
                    width={80}
                    height={80}
                    className="object-contain max-h-full mix-blend-multiply dark:mix-blend-normal"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {alert.productTitle}
                </h3>

                {!hidePriceDetails && (
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Target</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                ₹{alert.targetPrice.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Current</span>
                            <span className={`font-bold ${isDrop ? "text-green-600" : "text-gray-900 dark:text-white"}`}>
                                ₹{alert.currentPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {isDrop && !hidePriceDetails && (
                    <div className="mt-2 text-xs font-bold text-green-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">trending_down</span>
                        Price dropped by {dropPercent}%!
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setIsDelegateOpen(true)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Delegate to Agent"
                >
                    <span className="material-symbols-outlined">smart_toy</span>
                </button>
                {/* Link to product */}
                <a
                    href={alert.productLink}
                    target="_blank"
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="View Product"
                >
                    <span className="material-symbols-outlined">open_in_new</span>
                </a>
                <button
                    onClick={handleRemove}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Remove Alert"
                >
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </div>

            <AgentDelegateModal
                alert={alert}
                isOpen={isDelegateOpen}
                onClose={() => setIsDelegateOpen(false)}
            />
        </div >
    );
}
