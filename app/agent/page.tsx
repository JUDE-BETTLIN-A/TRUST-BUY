"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { saveAgentConfig, getAgentConfig, toggleAutoBuy, executeAutoBuy, getOrders } from "./actions";
import { getAlerts, refreshAlerts } from "../alerts/actions";

export default function AgentPage() {
    const [config, setConfig] = useState({ shippingAddress: "", paymentMethod: "", walletBalance: 0 });
    const [alerts, setAlerts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [agentStatus, setAgentStatus] = useState("Idle");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [conf, alts, ords] = await Promise.all([
            getAgentConfig(),
            getAlerts(),
            getOrders()
        ]);
        if (conf) setConfig({
            shippingAddress: conf.shippingAddress || "",
            paymentMethod: conf.paymentMethod || "",
            walletBalance: conf.walletBalance || 0
        });
        setAlerts(alts);
        setOrders(ords);
        setIsLoading(false);
    };

    const handleSaveConfig = async () => {
        setIsSaving(true);
        await saveAgentConfig(config.shippingAddress, config.paymentMethod);
        setIsSaving(false);
        alert("Agent settings saved!");
    };

    const handleToggleAutoBuy = async (id: string, current: boolean) => {
        await toggleAutoBuy(id, !current);
        loadData();
    };


    const runAgentCheck = async () => {
        setAgentStatus("Scanning Market Prices...");

        // 1. Refresh latest prices
        const result = await refreshAlerts();

        if ((result?.droppedProducts?.length || 0) > 0) {
            setAgentStatus("Price Drop Detected! Checking Auto-Buy rules...");

            // 2. Check which dropped products have auto-buy enabled
            // We need to re-fetch alerts to get the latest prices and autoBuy status
            const currentAlerts = await getAlerts();

            for (const alert of currentAlerts) {
                // Should act if:
                // 1. Auto Pay is enabled AND Price <= Target
                // OR
                // 2. Manual Pay is enabled AND Price <= Target (Just notify, but here we simulate 'checking')

                if (alert.currentPrice <= alert.targetPrice) {
                    if (alert.agentPaymentMode === 'AUTO') {
                        setAgentStatus(`Auto-Buying ${alert.productTitle}...`);
                        const res = await executeAutoBuy(alert.id);
                        if (res.error) {
                            setAgentStatus(`Error: ${res.error}`);
                        }
                    } else if (alert.agentPaymentMode === 'MANUAL') {
                        setAgentStatus(`Alerting user for ${alert.productTitle}...`);
                        // Simulation of sending notification
                    }
                }
            }
            setTimeout(() => setAgentStatus("Agent Cycle Complete."), 2000);
        } else {
            setAgentStatus("No target prices matched.");
        }

        loadData(); // Reload orders and alerts
        setTimeout(() => setAgentStatus("Idle"), 4000);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl text-primary">smart_toy</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TrustBuy Agent</h1>
                        <p className="text-gray-500">Your autonomous shopping assistant.</p>
                    </div>
                </div>

                {/* Wallet removed moved to Settings */}

            </header>

            {/* 1. Secure Configuration Section */}
            <section className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="bg-slate-900 dark:bg-black/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <span className="material-symbols-outlined text-green-500">verified_user</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Security & Delivery Config</h2>
                            <p className="text-slate-400 text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                End-to-end encrypted for TrustBuy Agent purchases
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">AES-256 Secure</span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Shipping Address */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                                <span className="material-symbols-outlined text-gray-400 text-lg">local_shipping</span>
                                Primary Shipping Address
                            </label>
                            <div className="relative group">
                                <textarea
                                    value={config.shippingAddress}
                                    onChange={(e) => setConfig({ ...config, shippingAddress: e.target.value })}
                                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-sm transition-all min-h-[100px] resize-none"
                                    placeholder="Enter your full street address, apartment, city, and zip code..."
                                />
                                <div className="absolute top-3 right-3 text-gray-300 pointer-events-none group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">edit_location</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                                <span className="material-symbols-outlined text-gray-400 text-lg">payments</span>
                                Backup Payment Method
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={config.paymentMethod}
                                    onChange={(e) => setConfig({ ...config, paymentMethod: e.target.value })}
                                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-sm transition-all pr-12"
                                    placeholder="Enter Card Number or UPI ID..."
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-300 text-xl">shield</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <span className="material-symbols-outlined text-blue-500 text-sm">info</span>
                                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                                    Wallet balance is always used first. This backup is only for coverage.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={16} height={16} />
                                </div>
                                <div className="size-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MC" width={16} height={16} />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">All major payment gateways supported via secure transit.</p>
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            disabled={isSaving}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">encrypted</span>
                                    Save Securely
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Delegated Tasks Section */}
            <section className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">task</span>
                        Delegated Tasks
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Agent Monitoring Active
                    </div>
                </div>

                <div className="space-y-4">
                    {alerts.filter(a => a.agentPaymentMode).length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">assignment_late</span>
                            <p className="text-gray-500 font-medium">No tasks currently delegated.</p>
                            <p className="text-sm text-gray-400 mt-1">Delegated products will appear here for autonomous monitoring.</p>
                        </div>
                    ) : (
                        alerts.filter(a => a.agentPaymentMode).map(alert => (
                            <div key={alert.id} className="group flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-light border border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                <div className="w-16 h-16 relative bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-50">
                                    <Image src={alert.productImage} alt={alert.productTitle} fill className="object-contain p-1" />
                                </div>

                                <div className="flex-1 min-w-0 w-full sm:w-auto">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate max-w-[250px]">{alert.productTitle}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${alert.agentPaymentMode === 'AUTO' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'}`}>
                                            {alert.agentPaymentMode === 'AUTO' ? 'Auto-Buy' : 'Notify'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Target Price</p>
                                            <p className="font-bold text-gray-900 dark:text-white">₹{alert.targetPrice.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Market Price</p>
                                            <p className={`font-bold ${alert.currentPrice <= alert.targetPrice ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                                ₹{alert.currentPrice.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`size-1.5 rounded-full ${alert.currentPrice <= alert.targetPrice ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    {alert.currentPrice <= alert.targetPrice ? 'Target Reached' : 'Monitoring'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        onClick={() => handleToggleAutoBuy(alert.id, false)}
                                        title="Cancel Delegation"
                                    >
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* 3. Order History Section */}
            <section className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">receipt_long</span>
                    Agent Purchase History
                </h2>
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No agent orders placed yet.</p>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                                <div className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full shrink-0">
                                    <span className="material-symbols-outlined">check</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white">{order.productTitle}</h4>
                                    <p className="text-sm text-gray-500">Ordered on {new Date(order.orderedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 dark:text-white">₹{order.price}</div>
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
