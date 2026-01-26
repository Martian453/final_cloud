"use client"

import { useEffect, useState } from "react"
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

export function PredictiveChart() {
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        // Generate Forecast Data (Future 24h)
        const labels = Array.from({ length: 24 }, (_, i) => {
            const d = new Date();
            d.setHours(d.getHours() + i);
            return d.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
        });

        // Mock Prediction Trend (Sine wave + slight random)
        const predictedValues = labels.map((_, i) => 30 + Math.sin(i / 4) * 10 + Math.random() * 5);

        setData({
            labels,
            datasets: [
                {
                    label: 'AQI Forecast (Experimental)',
                    data: predictedValues,
                    borderColor: 'rgba(124, 255, 154, 0.6)', // Greenish
                    backgroundColor: 'rgba(124, 255, 154, 0.05)',
                    borderWidth: 2,
                    borderDash: [5, 5], // Dotted Line
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                }
            ],
        })
    }, [])

    const options = {
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
                ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 8 },
            },
            y: {
                grid: { color: 'rgba(148, 163, 184, 0.05)', drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10 } },
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    }

    if (!data) return null;

    return (
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Predictive Analysis
                    </h3>
                    <p className="text-[10px] text-slate-500">24H Forecase Model (Experimental)</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400">MODEL ACTIVE</span>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <Line options={options} data={data} />
            </div>
        </div>
    )
}
