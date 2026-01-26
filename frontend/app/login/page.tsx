"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            await login(email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050511] font-sans selection:bg-emerald-500/30">

            {/* --- COSMIC BACKGROUND --- */}
            <div className="absolute inset-0 z-0">
                {/* 1. Deep Space Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0b1026_0%,_#000000_100%)]" />

                {/* 2. Stars Layer */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-10 left-1/4 h-1 w-1 bg-white rounded-full animate-pulse duration-[3s]" />
                    <div className="absolute top-1/3 left-10 h-0.5 w-0.5 bg-white rounded-full animate-pulse duration-[5s]" />
                    <div className="absolute bottom-1/4 right-1/4 h-1 w-1 bg-blue-200 rounded-full animate-pulse duration-[4s]" />
                </div>

                {/* 3. The Earth Asset */}
                <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
                    <div className="relative w-[1200px] h-[1200px] animate-[spin_120s_linear_infinite]">
                        {/* Using the generated asset - make sure to use object-cover or contain appropriately */}
                        <Image
                            src="/cosmic-earth.png"
                            alt="EcoSphere Earth"
                            fill
                            className="object-contain opacity-80 blur-[1px] scale-125"
                            priority
                        />
                    </div>
                </div>

                {/* 4. Overlay Gradient for readability */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>

            {/* --- GLASS CARD --- */}
            <div className="relative z-10 w-full max-w-[420px] p-8 mx-4">
                {/* Card Container */}
                <div className="relative group">
                    {/* Glow Effect behind card */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />

                    <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">

                        {/* Shimmer Border Top */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        {/* BRANDING */}
                        <div className="text-center mb-10 space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 mb-4 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                                <div className="h-5 w-5 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                EcoSphere
                                <span className="block text-lg font-normal text-slate-400 mt-1 tracking-[0.2em] uppercase text-[12px]">Intelligence</span>
                            </h1>
                        </div>

                        {/* ERROR */}
                        {error && (
                            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </div>
                        )}

                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all duration-300"
                                        placeholder="Access ID / Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all duration-300"
                                        placeholder="Security Key"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Initialize Session</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* FOOTER */}
                        <div className="mt-8 text-center">
                            <Link href="/signup" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                                <span>No uplink detected? Register Node</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-6 text-[10px] text-slate-600 uppercase tracking-widest">
                    Secured by Quantum-256 Encryption
                </div>
            </div>
        </div>
    );
}

