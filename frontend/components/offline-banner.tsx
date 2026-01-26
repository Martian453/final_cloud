"use client"

import { WifiOff, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface OfflineBannerProps {
    isOffline: boolean
    lastUpdate?: string
}

export function OfflineBanner({ isOffline, lastUpdate }: OfflineBannerProps) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (isOffline) {
            setShow(true)
        } else {
            // Delay hiding to show reconnection message
            const timer = setTimeout(() => setShow(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isOffline])

    if (!show) return null

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${isOffline
                ? 'bg-black/40 backdrop-blur-[2px] opacity-100 pointer-events-auto'
                : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'
                }`}
        >
            <div className={`relative transform transition-all duration-500 ${isOffline ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                }`}>
                <div className="flex flex-col items-center gap-6 p-12 rounded-3xl border border-orange-500/20 bg-[#0f0a15]/90 shadow-[0_0_100px_rgba(234,88,12,0.15)] backdrop-blur-xl">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-orange-500/20 blur-xl animate-pulse" />
                        <WifiOff className="relative h-16 w-16 text-orange-500" />
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-white">System Offline</h2>
                        <p className="text-slate-400 font-mono text-sm max-w-[280px]">
                            Connection to environmental sensors has been lost. Dashboard is frozen.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                            Reconnecting...
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                            Last update: {lastUpdate || 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
