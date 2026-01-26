"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from "recharts"
import { useMemo, useState } from "react"

interface MetricHistoryChartProps {
    data: any[] // Array of history objects { label, pm25, pm10, co, no2 }
    activeMetric: string
    timeRange: "1h" | "24h" | "7d"
    onTimeRangeChange: (range: "1h" | "24h" | "7d") => void
}

export function MetricHistoryChart({ data, activeMetric, timeRange, onTimeRangeChange }: MetricHistoryChartProps) {
    const [hoveredTime, setHoveredTime] = useState<string | null>(null)
    const [activeLines, setActiveLines] = useState<string[]>(["pm25"]) // Track which lines are visible

    // Process data based on time range
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        let filteredData = data;

        // Filter based on time range
        if (timeRange === "1h") {
            filteredData = data.slice(-20); // Last 20 data points (~20 minutes if 1m interval)
        } else if (timeRange === "24h") {
            filteredData = data.slice(-288); // Last 288 points (~24 hours if 5m interval)
        }
        // 7d = all available data

        return filteredData.map(d => ({
            time: d.label || d.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pm25: d.pm25 ?? 0,
            pm10: d.pm10 ?? 0,
            co: d.co ?? 0,
            no2: d.no2 ?? 0,
            o3: d.o3 ?? 0,
            so2: d.so2 ?? 0,
        }));
    }, [data, timeRange]);

    const metrics = [
        { key: 'pm25', label: 'PM2.5', color: '#f97316' }, // Orange
        { key: 'pm10', label: 'PM10', color: '#fbbf24' },  // Yellow
        { key: 'co', label: 'CO', color: '#34d399' },      // Green
        { key: 'o3', label: 'O3', color: '#3b82f6' },      // Blue
        { key: 'no2', label: 'NO2', color: '#a855f7' },    // Purple
        { key: 'so2', label: 'SO2', color: '#f43f5e' },    // Rose
    ]

    // Toggle line visibility when clicking on legend or using activeMetric
    const toggleLine = (metric: string) => {
        setActiveLines(prev => {
            if (prev.includes(metric)) {
                // Don't allow removing the last line
                if (prev.length === 1) return prev
                return prev.filter(m => m !== metric)
            } else {
                return [...prev, metric]
            }
        })
    }

    // Sync activeMetric with activeLines (Exclusive Mode)
    useMemo(() => {
        if (activeMetric) {
            setActiveLines([activeMetric])
        }
    }, [activeMetric])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null

        return (
            <div className="bg-slate-950/95 border border-white/20 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => {
                        if (!activeLines.includes(entry.dataKey)) return null
                        return (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm font-medium text-white">{entry.name}:</span>
                                </div>
                                <span className="text-sm font-bold text-white">{entry.value.toFixed(1)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full flex flex-col p-6 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

            <div className="relative z-10 flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                        AQI Pollutant Levels
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Click metrics to toggle visibility</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/10">
                    {(["1h", "24h", "7d"] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => onTimeRangeChange(r)}
                            className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${timeRange === r
                                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interactive Legend */}
            <div className="relative z-10 flex flex-wrap gap-3 mb-4">
                {metrics.map((metric) => (
                    <button
                        key={metric.key}
                        onClick={() => toggleLine(metric.key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${activeLines.includes(metric.key)
                            ? "border-white/20 bg-white/10 shadow-sm"
                            : "border-white/5 bg-slate-900/50 opacity-50 hover:opacity-70"
                            }`}
                    >
                        <div
                            className={`w-3 h-3 rounded-full transition-all ${activeLines.includes(metric.key) ? 'animate-pulse' : ''
                                }`}
                            style={{
                                backgroundColor: activeLines.includes(metric.key) ? metric.color : 'rgba(148, 163, 184, 0.3)'
                            }}
                        />
                        <span className={`text-xs font-semibold ${activeLines.includes(metric.key) ? 'text-white' : 'text-slate-500'
                            }`}>
                            {metric.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="relative z-10 flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        onMouseMove={(e: any) => {
                            if (e && e.activeLabel) {
                                setHoveredTime(e.activeLabel)
                            }
                        }}
                        onMouseLeave={() => setHoveredTime(null)}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#475569"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            minTickGap={40}
                        />
                        <YAxis
                            stroke="#475569"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            domain={[0, 'auto']}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={100}
                            stroke="#ef4444"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            opacity={0.5}
                            label={{
                                position: 'insideTopRight',
                                value: 'Threshold',
                                fill: '#ef4444',
                                fontSize: 11,
                                fontWeight: 600
                            }}
                        />

                        {/* Render lines for all metrics */}
                        {metrics.map((metric) => (
                            <Line
                                key={metric.key}
                                type="monotone"
                                dataKey={metric.key}
                                name={metric.label}
                                stroke={metric.color}
                                strokeWidth={activeLines.includes(metric.key) ? 3 : 0}
                                dot={{
                                    r: activeLines.includes(metric.key) ? 4 : 0,
                                    fill: "#0f172a",
                                    stroke: metric.color,
                                    strokeWidth: 2
                                }}
                                activeDot={{
                                    r: 6,
                                    strokeWidth: 0,
                                    fill: metric.color,
                                    style: {
                                        filter: `drop-shadow(0 0 6px ${metric.color})`
                                    }
                                }}
                                isAnimationActive={true}
                                animationDuration={500}
                                connectNulls
                                hide={!activeLines.includes(metric.key)}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
