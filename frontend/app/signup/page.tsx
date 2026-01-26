"use client";

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';

export default function SignupPage() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />

            <div className="z-10 w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        Join Cosmic IoT
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">Create your private monitoring space</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full mt-1 p-2 bg-black/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full mt-1 p-2 bg-black/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full mt-1 p-2 bg-black/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
