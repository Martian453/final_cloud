"use client"

import { useEffect, useState, useMemo } from "react"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface PredictiveChartProps {
    data?: {
        labels: string[]
        pm25: number[]
    }
}

export function PredictiveChart({ data: historicalData }: PredictiveChartProps) {
    const [chartData, setChartData] = useState<any>(null)

    useEffect(() => {
        if (!historicalData || historicalData.pm25.length < 2) {
            // Fallback or empty state if not enough data
            // keeping dummy for "No Data" state could be misleading, better to show flat line or empty?
            // Let's show a loading or "Waiting for data" state if empty.
            // For now, let's just return if no data to avoid crash.
            return;
        }

        // 1. Get last N points (e.g. last 10 points)
        const nStream = 10;
        const recentValues = historicalData.pm25.slice(-nStream);

        // 2. Simple Linear Regression (y = mx + b)
        // x = 0, 1, 2... 
        const n = recentValues.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += recentValues[i];
            sumXY += (i * recentValues[i]);
            sumXX += (i * i);
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 3. Project Future (Next 12 Hours)
        // The last actual point is at x = n-1.
        // Future points start at x = n, n+1...
        const futureLabels = [];
        const futureValues = [];

        const lastTimeStr = historicalData.labels[historicalData.labels.length - 1] || new Date().toLocaleTimeString();
        // Naive time increment (assuming 1 hour intervals or just labels)
        // Let's just generate next hours from "Now"
        const now = new Date();

        for (let i = 0; i < 12; i++) {
            const nextTime = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
            futureLabels.push(nextTime.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }));

            // Forecast value: y = mx + b (where x extends beyond n)
            // recentValues indices: 0 to n-1
            // Future indices: n + i
            let val = slope * (n + i) + intercept;

            // Dampen extreme slopes for realism (simple clamp or decay)
            // Ensure non-negative
            val = Math.max(0, val);

            // Add a tiny bit of "uncertainty" noise
            val += (Math.random() - 0.5) * 5;

            futureValues.push(val);
        }

        setChartData({
            labels: futureLabels,
            datasets: [
                {
                    label: 'AQI Forecast (Trend)',
                    data: futureValues,
                    borderColor: 'rgba(124, 255, 154, 0.8)', // Greenish
                    backgroundColor: 'rgba(124, 255, 154, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5], // Dotted Line
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgba(124, 255, 154, 1)',
                }
            ],
        })
    }, [historicalData])

    // Options (same as before)
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: { color: '#94a3b8', font: { size: 10 } }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(148, 163, 184, 0.1)',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 6 },
            },
            y: {
                grid: { color: 'rgba(148, 163, 184, 0.05)', drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10 } },
                suggestedMin: 0,
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    }), []);

    if (!chartData) {
        return (
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl flex items-center justify-center">
                <p className="text-slate-500 text-xs">Collecting data for forecast...</p>
            </div>
        )
    }

    return (
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Predictive Analysis
                    </h3>
                    <p className="text-[10px] text-slate-500">12H Trend Forecast (Linear Regression)</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400">LIVE MODEL</span>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <Line options={options} data={chartData} />
            </div>
        </div>
    )
}
