"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function SignupPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(email, password, fullName);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050511] font-sans selection:bg-purple-500/30">

            {/* --- COSMIC BACKGROUND (Reuse) --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a0b26_0%,_#000000_100%)]" />

                {/* Stars Layer */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-20 right-1/4 h-1 w-1 bg-white rounded-full animate-pulse duration-[3s]" />
                    <div className="absolute bottom-1/3 left-10 h-0.5 w-0.5 bg-white rounded-full animate-pulse duration-[5s]" />
                </div>

                {/* Earth Asset (Slightly Shifted/Rotated for variety) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
                    <div className="relative w-[1200px] h-[1200px] animate-[spin_150s_linear_infinite_reverse]">
                        <Image
                            src="/cosmic-earth.png"
                            alt="EcoSphere Earth"
                            fill
                            className="object-contain opacity-60 blur-[1px] hue-rotate-15 scale-125"
                            priority
                        />
                    </div>
                </div>

                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
            </div>

            {/* --- GLASS CARD --- */}
            <div className="relative z-10 w-full max-w-[420px] p-8 mx-4">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        {/* BRANDING */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                <ShieldCheck className="h-6 w-6 text-purple-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                Join The Network
                            </h1>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">
                                Private EcoSphere Node Setup
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <div className="relative group/input">
                                    <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within/input:text-purple-400 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within/input:text-purple-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within/input:text-purple-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300"
                                        placeholder="Create Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Create Identity</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-purple-400 transition-colors">
                                <span>Already initialized? Login</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
