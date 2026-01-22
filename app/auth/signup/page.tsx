"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { GoogleAccountChooser } from "@/components/auth/GoogleAccountChooser";

export default function SignUpPage() {
    const [showGoogleModal, setShowGoogleModal] = useState(false);

    const handleGoogleLogin = async (account: { email: string; name: string }) => {
        // Simulate a "Social Login" by signing in with credentials using the selected email.
        // The mock provider accepts any password, so we use a placeholder.
        await signIn("credentials", {
            email: account.email,
            name: account.name,
            password: "social-login-mock-pass",
            callbackUrl: "/home"
        });
    };

    const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            name: formData.get("name"),
            callbackUrl: "/home"
        });
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[60vh] h-[60vh] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[60vh] h-[60vh] rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
                            <ShieldCheck className="text-white h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold text-white">TrustBuy</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Create an Account</h1>
                    <p className="text-white/50">Join thousands of smart shoppers today.</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 mb-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowGoogleModal(true)}
                                className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                                Google
                            </button>

                            <button
                                onClick={() => signIn("facebook", { callbackUrl: "/home" })}
                                className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white font-semibold py-2.5 rounded-xl hover:bg-[#1864D9] transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-6.304 6.162-6.304 1.582 0 3.07.135 3.07.135v3.315h-1.684c-1.956 0-2.484 1.258-2.484 2.551v1.884h3.66l-1.018 3.666h-2.646v7.98c5.207-.803 9.18-5.289 9.18-10.669a10.8 10.8 0 1 0-22.34 0c0 5.38 3.974 9.866 9.181 10.669z" />
                                </svg>
                                Facebook
                            </button>
                        </div>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-white/40 text-xs uppercase tracking-wider font-medium">Or continue with</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>
                    </div>

                    <form onSubmit={handleEmailSignUp} className="relative z-10 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>

                    <div className="relative z-10 mt-6 text-center">
                        <p className="text-sm text-white/40">
                            Already have an account?{' '}
                            <Link href="/auth/signin" className="text-white hover:text-primary font-medium transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {showGoogleModal && (
                <GoogleAccountChooser
                    onSelect={handleGoogleLogin}
                    onClose={() => setShowGoogleModal(false)}
                />
            )}
        </div>
    );
}
