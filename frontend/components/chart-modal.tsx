"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Area,
    AreaChart,
} from "recharts"

interface ChartModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    data: any[]
    dataKey: string
    color: string
    unit?: string
    showSmoothing?: boolean
}

export function ChartModal({
    isOpen,
    onClose,
    title,
    data,
    dataKey,
    color,
    unit = "",
    showSmoothing = true,
}: ChartModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // Handle ESC key to close modal
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!mounted || !isOpen) return null

    // Ensure we have valid data for the chart
    const validData = data && data.length > 0 ? data : []

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-6xl rounded-2xl border border-white/10 bg-slate-950/90 p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-wide text-white">{title}</h2>
                        <p className="text-sm text-slate-400 mt-1">Detailed Historical Analysis • {validData.length} data points</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white hover:rotate-90 duration-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={validData}>
                            <defs>
                                <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="time" // Assumes data has 'time' or 'label' property. Will map in parent.
                                stroke="#475569"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={50}
                            />
                            <YAxis
                                stroke="#475569"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(2, 6, 23, 0.95)",
                                    border: `1px solid ${color}40`,
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                    fontSize: "14px",
                                    color: "#f1f5f9",
                                    padding: "12px"
                                }}
                                itemStyle={{ color: color, fontWeight: 600 }}
                                labelStyle={{ color: "#94a3b8", marginBottom: "8px", fontSize: "12px" }}
                                formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(2) : value} ${unit}`, title]}
                            />
                            <Area
                                type={showSmoothing ? "monotone" : "linear"}
                                dataKey={dataKey} // Use dynamic key (e.g., 'value', 'pm25')
                                stroke={color}
                                strokeWidth={4}
                                fillOpacity={1}
                                fill={`url(#color${dataKey})`}
                                isAnimationActive={true}
                                animationDuration={800}
                                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: color, strokeWidth: 0, style: { filter: `drop-shadow(0 0 8px ${color})` } }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
