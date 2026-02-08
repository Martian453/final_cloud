"use client"

import { useEffect, useState } from "react"
import { Chart } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

interface WaterQualityData {
  level: number
  ph: number
  turbidity: number
  chartData: {
    labels: string[]
    level: number[]
    ph: number[]
    turbidity: number[]
  }
}

import { Maximize2 } from "lucide-react"

interface WaterQualityCardProps {
  data: WaterQualityData
  activeMetric: string | null
  onMetricSelect: (metric: string | null) => void
  onExpand?: () => void
  isOffline?: boolean
}

export function WaterQualityCard({ data, activeMetric, onMetricSelect, onExpand, isOffline = false }: WaterQualityCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)
  const [animatedValues, setAnimatedValues] = useState({
    level: 0,
    ph: 0,
    turbidity: 0,
  })

  // ... (Keep existing useEffects for animation) ...
  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const duration = 1200
    const startTime = Date.now()
    const startValues = { ...animatedValues }

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimatedValues({
        level: startValues.level + (data.level - startValues.level) * eased,
        ph: startValues.ph + (data.ph - startValues.ph) * eased,
        turbidity: startValues.turbidity + (data.turbidity - startValues.turbidity) * eased,
      })

      if (progress < 1) requestAnimationFrame(animate)
    }

    animate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.level, data.ph, data.turbidity])

  // Chart Data Preparation
  const allLabels = ["Ground Water Level", "pH Level", "Turbidity"]
  const allLineData = [animatedValues.level, animatedValues.ph, animatedValues.turbidity]
  const allBarData = [animatedValues.level, animatedValues.ph, animatedValues.turbidity]

  // Filter based on activeMetric
  // User requested "highlight" behavior, meaning Show All but emphasize the selected one.
  // Actually, previous request was "hiding". Current request says "bar graph is gone only showing one".
  // So we should SHOW ALL bars always, but dim the ones that are not active.

  const chartData = {
    labels: allLabels, // Always show all labels
    datasets: [
      {
        type: 'line' as const,
        label: 'Trend',
        data: allLineData, // Always show all data points
        borderColor: "rgba(143, 211, 255, 0.5)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: [
          (activeMetric === null || activeMetric === "level" || hoveredMetric === "level") ? "rgba(143, 211, 255, 1)" : "rgba(143, 211, 255, 0.1)",
          (activeMetric === null || activeMetric === "ph" || hoveredMetric === "ph") ? "rgba(124, 255, 154, 1)" : "rgba(124, 255, 154, 0.1)",
          (activeMetric === null || activeMetric === "turbidity" || hoveredMetric === "turbidity") ? "rgba(255, 211, 106, 1)" : "rgba(255, 211, 106, 0.1)",
        ],
        pointBorderColor: "#0f172a",
        pointBorderWidth: 2,
        order: 0,
      },
      {
        type: 'bar' as const,
        label: 'Value',
        data: allBarData, // Always show all bars
        backgroundColor: [
          (activeMetric === null || activeMetric === "level" || hoveredMetric === "level") ? "rgba(6, 182, 212, 1)" : "rgba(6, 182, 212, 0.1)", // Level
          (activeMetric === null || activeMetric === "ph" || hoveredMetric === "ph") ? "rgba(34, 197, 94, 1)" : "rgba(34, 197, 94, 0.1)", // pH
          (activeMetric === null || activeMetric === "turbidity" || hoveredMetric === "turbidity") ? "rgba(251, 191, 36, 1)" : "rgba(251, 191, 36, 0.1)", // Turbidity
        ],
        borderRadius: 8,
        barThickness: 50,
        order: 1,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(2, 6, 23, 0.9)",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        borderColor: "rgba(148, 163, 184, 0.1)",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Value: ${context.parsed.y?.toFixed(2) ?? 'N/A'}`,
        },
      }
    },
    scales: {
      x: {
        ticks: { color: "#64748b", font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#64748b", font: { size: 10 } },
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.05)" },
        border: { display: false }
      }
    },
    animation: {
      duration: 750,
      easing: "easeInOutQuart" as const,
    }
  }

  const metrics = [
    {
      key: "level",
      label: "Ground\nWater Level",
      value: animatedValues.level.toFixed(1),
      unit: "ft",
      color: "text-cyan-400",
      hoverColor: "text-cyan-300",
      glow: "drop-shadow-[0_0_10px_rgba(143,211,255,0.5)]",
      bgGlow: "shadow-[0_0_25px_rgba(143,211,255,0.3)]"
    },
    {
      key: "ph",
      label: "pH Level",
      value: animatedValues.ph.toFixed(1),
      range: "Within 6.5 - 8.5",
      color: "text-emerald-400",
      hoverColor: "text-emerald-300",
      glow: "drop-shadow-[0_0_10px_rgba(124,255,154,0.5)]",
      bgGlow: "shadow-[0_0_25px_rgba(124,255,154,0.3)]"
    },
    {
      key: "turbidity",
      label: "Turbidity",
      value: animatedValues.turbidity.toFixed(1),
      unit: "ppb",
      color: "text-amber-400",
      hoverColor: "text-amber-300",
      glow: "drop-shadow-[0_0_10px_rgba(255,211,106,0.5)]",
      bgGlow: "shadow-[0_0_25px_rgba(255,211,106,0.3)]"
    },
  ]

  return (
    <div
      className={`card-vibrant card-water group relative flex h-full flex-col transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        } ${isOffline ? 'opacity-50 blur-[2px] pointer-events-none' : 'cursor-pointer hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]'}`}
      style={{ transitionDelay: "200ms" }}
      onClick={onExpand}
    >
      {isOffline && (
        <div className="absolute top-4 right-12 z-50 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          OFFLINE
        </div>
      )}
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-1/4 -top-1/4 h-1/2 w-1/2 animate-blob rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="animation-delay-2000 absolute -left-1/4 bottom-1/4 h-1/2 w-1/2 animate-blob rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-cyan-500/5 to-transparent" />
      </div>

      <div className="relative z-10 mb-4 flex items-center justify-center">
        <h2 className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-sm font-medium uppercase tracking-[0.2em] text-transparent">
          Water Quality
        </h2>
        {onExpand && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="absolute right-0 rounded-full bg-white/5 p-1.5 text-cyan-400/70 transition-colors hover:bg-white/10 hover:text-cyan-400"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="relative z-10 mb-4 grid grid-cols-3 gap-2">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            onClick={(e) => {
              e.stopPropagation();
              onMetricSelect(m.key === activeMetric ? null : m.key);
            }}
            className={`group/item cursor-pointer rounded-xl border p-3 text-center backdrop-blur-sm transition-all duration-300 ${(activeMetric === m.key)
              ? `border-cyan-500/50 bg-cyan-500/10 scale-105 ${m.bgGlow}`
              : "border-white/5 bg-slate-900/50 hover:border-cyan-500/30 hover:bg-slate-800/50 opacity-80 hover:opacity-100"
              }`}
            style={{ animationDelay: `${i * 100}ms` }}
            onMouseEnter={() => setHoveredMetric(m.key)}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <div className={`mb-2 whitespace-pre-line text-[9px] font-semibold uppercase tracking-wider transition-colors ${activeMetric === m.key ? "text-cyan-300" : "text-slate-500"
              }`}>
              {m.label}
            </div>
            <div
              className={`text-2xl font-bold transition-all duration-300 ${(activeMetric === m.key || hoveredMetric === m.key) ? `${m.hoverColor} ${m.glow} scale-110` : `${m.color} ${m.glow}`
                }`}
            >
              {m.value}
            </div>
            {m.unit && <div className="text-[10px] text-slate-500">{m.unit}</div>}
            {m.range && <div className="text-[8px] text-slate-500">{m.range}</div>}
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="relative z-10 mb-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Water Quality
          </h3>
          {activeMetric && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMetricSelect(null);
              }}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
            >
              Show All Metrics
            </button>
          )}
        </div>
        <div className="h-[180px]">
          <Chart type="bar" data={chartData} options={chartOptions as any} />
        </div>
      </div>


      {/* Animated border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-500/10 transition-colors duration-300 group-hover:border-cyan-500/30" />
    </div>
  )
}
