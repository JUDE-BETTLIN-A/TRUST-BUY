"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAgentConfig, delegateToAgentAction } from "@/app/agent/actions";

interface AgentDelegateModalProps {
    alert: any;
    isOpen: boolean;
    onClose: () => void;
}

export function AgentDelegateModal({ alert, isOpen, onClose }: AgentDelegateModalProps) {
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [targetPrice, setTargetPrice] = useState(alert.targetPrice || 0);
    const [paymentMode, setPaymentMode] = useState<"AUTO" | "MANUAL">("MANUAL");

    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            console.log("Opening modal for", alert.productTitle);

            // Open dialog immediately to ensure visibility
            if (dialogRef.current && !dialogRef.current.open) {
                dialogRef.current.showModal();
            }

            setLoading(true);
            setTargetPrice(alert.targetPrice || 0);
            setPaymentMode(alert.agentPaymentMode === "AUTO" ? "AUTO" : "MANUAL");

            getAgentConfig()
                .then(config => {
                    if (config) {
                        setWalletBalance(config.walletBalance || 0);
                    }
                })
                .catch(err => console.error("Failed to fetch wallet balance:", err))
                .finally(() => setLoading(false));

        } else {
            if (dialogRef.current && dialogRef.current.open) {
                dialogRef.current.close();
            }
        }
    }, [isOpen, alert]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        if (paymentMode === "AUTO" && walletBalance < targetPrice) {
            alert("Insufficient wallet balance for Auto-Pay! Please deposit money in the Agent page.");
            setIsSubmitting(false);
            return;
        }

        await delegateToAgentAction(alert.id, Number(targetPrice), paymentMode);
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <dialog
            ref={dialogRef}
            onClose={() => onClose()}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] p-4 w-full h-full bg-transparent"
        >
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 relative w-full max-w-lg m-auto">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="size-16 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-primary">smart_toy</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delegate to Agent</h3>
                        <p className="text-sm text-gray-500">
                            Let the TrustBuy Agent handle this alert for you.
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Product Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl mb-6 border border-gray-100 dark:border-gray-700">
                    <div className="size-12 rounded-lg bg-white p-1 shrink-0 overflow-hidden relative">
                        <Image src={alert.productImage} alt="Product" fill className="object-contain" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{alert.productTitle}</p>
                        <p className="text-xs text-gray-500">Current Price: <span className="font-bold text-gray-900 dark:text-white">₹{alert.currentPrice}</span></p>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Wallet Status */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                                <span className="text-sm font-bold">Wallet Balance</span>
                            </div>
                            <div className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                                {loading ? "..." : `₹${walletBalance.toLocaleString()}`}
                            </div>
                        </div>
                        <Link
                            href="/settings#wallet"
                            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow hover:bg-blue-50 transition-all flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Money
                        </Link>
                    </div>

                    {/* ... rest of the form ... */}

                    {/* Target Price */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                            <input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-lg"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Agent will monitor and act when price drops to or below this amount.</p>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Agent Action</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setPaymentMode("AUTO")}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 ${paymentMode === "AUTO" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                            >
                                <span className={`material-symbols-outlined ${paymentMode === "AUTO" ? "text-primary" : "text-gray-400"}`}>bolt</span>
                                <span className={`font-bold text-sm ${paymentMode === "AUTO" ? "text-primary" : "text-gray-600 dark:text-gray-400"}`}>Auto Pay & Buy</span>
                                <p className="text-[10px] text-gray-400 leading-tight">Deducts from wallet automatically.</p>
                            </div>

                            <div
                                onClick={() => setPaymentMode("MANUAL")}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 ${paymentMode === "MANUAL" ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                            >
                                <span className={`material-symbols-outlined ${paymentMode === "MANUAL" ? "text-purple-500" : "text-gray-400"}`}>notifications_active</span>
                                <span className={`font-bold text-sm ${paymentMode === "MANUAL" ? "text-purple-500" : "text-gray-600 dark:text-gray-400"}`}>Notify Only</span>
                                <p className="text-[10px] text-gray-400 leading-tight">Sends instant alert. You buy manually.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || loading}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                Confirm Delegate
                            </>
                        )}
                    </button>
                </div>

            </div>
        </dialog>
    );
}
