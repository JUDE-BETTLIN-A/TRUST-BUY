"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signupUser } from "./actions";

export default function SignUpPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleGoogleLogin = async () => {
        await signIn("google", { callbackUrl: "/home" });
    };

    const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;

        try {
            // First create user in database
            const result = await signupUser(email, password, name);

            if (!result.success) {
                setError(result.message);
                setLoading(false);
                return;
            }

            setSuccess(true);
            
            // Auto sign in after successful signup
            const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                // Signup succeeded but auto-login failed, redirect to signin
                router.push("/auth/signin?message=Account created. Please sign in.");
            } else {
                router.push("/home");
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col">
            {/* Top Navigation - Matches internal navbar style */}
            <nav className="w-full bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg">shield_lock</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">TrustBuy</h1>
                            <p className="text-[10px] text-primary font-medium mt-0.5 uppercase tracking-wider">Privacy First</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm hidden sm:inline">Already have an account?</span>
                        <Link
                            href="/auth/signin"
                            className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create an account</h1>
                        <p className="text-gray-500">Join thousands of smart shoppers today</p>
                    </div>

                    {/* Card - Matches internal card style */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        {/* Social Login Buttons */}
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <button
                                onClick={() => signIn("facebook", { callbackUrl: "/home" })}
                                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-semibold py-3 px-4 rounded-xl hover:bg-[#1665d8] transition-all active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-6.304 6.162-6.304 1.582 0 3.07.135 3.07.135v3.315h-1.684c-1.956 0-2.484 1.258-2.484 2.551v1.884h3.66l-1.018 3.666h-2.646v7.98c5.207-.803 9.18-5.289 9.18-10.669a10.8 10.8 0 1 0-22.34 0c0 5.38 3.974 9.866 9.181 10.669z" />
                                </svg>
                                Continue with Facebook
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center my-6">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-4 text-sm text-gray-400">or sign up with email</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    Account created! Signing you in...
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </form>

                        {/* Terms */}
                        <p className="text-xs text-gray-500 text-center mt-6">
                            By signing up, you agree to our{' '}
                            <a href="#" className="text-primary hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    </div>

                    {/* Mobile Sign In Link */}
                    <p className="text-center text-gray-500 text-sm mt-6 sm:hidden">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="text-primary font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 text-center border-t border-gray-200 bg-white">
                <p className="text-gray-400 text-sm">© 2026 TrustBuy Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
