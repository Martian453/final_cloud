"use client"

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts"
import { useState, useMemo } from "react"
import { calculateSubIndex } from "@/utils/aqi-calculator"

interface PollutantDonutChartProps {
    airData?: {
        pm25: number
        pm10: number
        co: number // keeping raw value here, assuming caller passes raw or processed? 
        // Wait, AirQualityCard passes raw data usually, but we fixed CO there.
        // Let's assume raw data is passed here from dashboard, so we need to handle CO conversion if needed?
        // Actually, dashboard passes raw data to AirQualityCard.
        // We should handle the conversion here too to be safe/consistent.
        no2: number
        so2: number
        o3?: number
    }
}

export function PollutantDonutChart({ airData }: PollutantDonutChartProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    const data = useMemo(() => {
        if (!airData) return [
            { name: "Loading...", value: 1, rawValue: 0, unit: "", color: "#334155" }
        ];

        // Ensure we handle CO unit conversion (ppb -> ppm) if raw data is passed
        // Raw data usually has CO in ppb (e.g. 342), calculator expects ppm.
        const coPpm = airData.co / 1000;

        const scores = [
            { name: "PM2.5", value: calculateSubIndex(airData.pm25, 'pm25'), rawValue: airData.pm25, unit: "µg/m³", color: "#fb923c" },
            { name: "PM10", value: calculateSubIndex(airData.pm10, 'pm10'), rawValue: airData.pm10, unit: "µg/m³", color: "#facc15" },
            { name: "NO2", value: calculateSubIndex(airData.no2, 'no2'), rawValue: airData.no2, unit: "µg/m³", color: "#a855f7" },
            { name: "SO2", value: calculateSubIndex(airData.so2, 'so2'), rawValue: airData.so2, unit: "µg/m³", color: "#f43f5e" },
            { name: "CO", value: calculateSubIndex(coPpm, 'co'), rawValue: airData.co, unit: "ppb", color: "#34d399" },
            { name: "O3", value: calculateSubIndex(airData.o3 || 0, 'o3'), rawValue: airData.o3 || 0, unit: "µg/m³", color: "#3b82f6" },
        ];

        // Filter out zero-impact pollutants to clean up chart, or keep top N?
        // Let's keep all that have > 0 value, or at least top 4 if many are small.
        // Actually, let's just show those with Value > 0.
        const activePollutants = scores.filter(s => s.value > 0);

        if (activePollutants.length === 0) {
            return [{ name: "Clean Air", value: 1, rawValue: 0, unit: "", color: "#10b981" }];
        }

        return activePollutants.sort((a, b) => b.value - a.value);
    }, [airData]);

    const activeItem = data[activeIndex] || data[0];

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    return (
        <div className="card-vibrant h-full w-full flex flex-col p-4 bg-slate-900/40 rounded-2xl border border-cyan-500/20 backdrop-blur-sm relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] bg-cyan-500/10 pointer-events-none" />

            <div className="flex items-center justify-between mb-2 relative z-10">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                        Cause Analysis
                    </h3>
                    <p className="text-[10px] text-slate-400">AQI Contribution</p>
                </div>
                {/* Animated Alert Dot if data exists */}
                {airData && (
                    <div className="relative">
                        <div className="absolute -inset-1 animate-pulse rounded-full bg-red-500/20 blur-sm" />
                        <div className={`h-2 w-2 rounded-full ${data[0]?.value > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                    </div>
                )}
            </div>

            <div className="flex-1 w-full relative min-h-[160px] z-10">
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <span className="text-3xl font-bold text-white drop-shadow-md">
                        {activeItem.value}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: activeItem.color }}>
                        {activeItem.name}
                    </span>
                    <span className="text-[8px] text-slate-500">Sub-Index</span>
                    {activeItem.rawValue !== undefined && (
                        <span className="text-[9px] text-cyan-400 mt-1">
                            (from {activeItem.rawValue?.toFixed(1)} {activeItem.unit})
                        </span>
                    )}
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
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
                                    strokeWidth={index === activeIndex ? 0 : 0}
                                    className="transition-all duration-300"
                                    style={{
                                        filter: index === activeIndex ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                                        opacity: index === activeIndex ? 1 : 0.7,
                                        transform: index === activeIndex ? 'scale(1.05)' : 'scale(1)',
                                        transformOrigin: 'center',
                                        outline: 'none'
                                    }}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-2 relative z-10">
                {data.slice(0, 4).map((entry, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-1.5 cursor-pointer transition-all duration-300 px-2 py-1 rounded-full ${index === activeIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                        onMouseEnter={() => setActiveIndex(index)}
                    >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 5px ${entry.color}` }} />
                        <span className={`text-[9px] font-medium ${index === activeIndex ? "text-white" : "text-slate-400"}`}>
                            {entry.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
