"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useState } from "react"

const data = [
    { name: "PM2.5", value: 45, color: "#7CFF9A" }, // Neon Green
    { name: "PM10", value: 30, color: "#FFD36A" },  // Neon Yellow
    { name: "NO2", value: 15, color: "#8FD3FF" },   // Neon Blue
    { name: "SO2", value: 10, color: "#FF6B6B" },   // Neon Red
]

export function PollutantDonutChart() {
    const [activeIndex, setActiveIndex] = useState(0)

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    return (
        <div className="card-vibrant h-full w-full flex flex-col p-4 bg-slate-900/40 rounded-2xl border border-cyan-500/20 backdrop-blur-sm relative overflow-visible">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                        Cause Analysis
                    </h3>
                    <p className="text-[10px] text-slate-400">Pollutant Contribution</p>
                </div>
                {/* Animated Alert Dot */}
                <div className="relative">
                    <div className="absolute -inset-1 animate-pulse rounded-full bg-red-500/30 blur-sm" />
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                </div>
            </div>

            <div className="flex-1 w-full relative min-h-[160px]">
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <span className="text-2xl font-bold text-white drop-shadow-md">
                        {data[activeIndex]?.value}%
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: data[activeIndex]?.color }}>
                        {data[activeIndex]?.name}
                    </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            stroke="none"
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="rgba(0,0,0,0.2)"
                                    strokeWidth={index === activeIndex ? 4 : 0}
                                    className="transition-all duration-300"
                                    style={{
                                        filter: index === activeIndex ? `drop-shadow(0 0 10px ${entry.color})` : 'none',
                                        transform: index === activeIndex ? 'scale(1.05)' : 'scale(1)',
                                        transformOrigin: 'center',
                                    }}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-3 mt-2">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onMouseEnter={() => setActiveIndex(index)}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 5px ${entry.color}` }} />
                        <span className="text-[9px] font-medium text-slate-300">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
