"use client";

import React from 'react';
import Image from 'next/image';

interface GoogleAccount {
    email: string;
    name: string;
    avatar: string;
}

interface GoogleAccountChooserProps {
    onSelect: (account: GoogleAccount) => void;
    onClose: () => void;
}

const MOCK_ACCOUNTS: GoogleAccount[] = [
    {
        email: "judeb@gmail.com",
        name: "Jude B",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocL-", // Placeholder or generic
    },
    {
        email: "demo.user@example.com",
        name: "Demo User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
    },
    {
        email: "add.account@gmail.com",
        name: "Use another account",
        avatar: "", // Special case
    }
];

export function GoogleAccountChooser({ onSelect, onClose }: GoogleAccountChooserProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[400px] bg-white dark:bg-[#202124] rounded-lg shadow-2xl overflow-hidden transform transition-all scale-100 opacity-100">
                {/* Header */}
                <div className="p-6 pb-2 text-center">
                    <div className="flex justify-center mb-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Sign in with Google</h3>
                    <p className="text-[15px] text-gray-900 dark:text-gray-100 mt-2">Choose an account</p>
                    <p className="text-[13px] text-gray-900 dark:text-gray-100 mt-1">to continue to <span className="text-blue-600 font-medium font-sans">TrustBuy</span></p>
                </div>

                {/* List */}
                <div className="mt-2 pb-4">
                    <ul className="flex flex-col">
                        {MOCK_ACCOUNTS.map((account, idx) => (
                            <li key={account.email}
                                onClick={() => {
                                    if (account.name === "Use another account") return; // For now just basic
                                    onSelect(account)
                                }}
                                className="px-8 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-4 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                                    {account.avatar ? (
                                        <Image src={account.avatar} alt={account.name} width={32} height={32} />
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">person_add</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{account.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{account.email}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
