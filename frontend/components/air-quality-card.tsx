"use client"

import { useEffect, useRef, useState } from "react"
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface AirQualityData {
  pm25: number
  pm10: number
  co: number
  no2: number
  o3: number
  so2: number
  chartData: {
    labels: string[]
    pm25: number[]
    pm10: number[]
    co: number[]
    no2: number[]
    o3: number[]
    so2: number[]
  }
}


import { Maximize2 } from "lucide-react"
import { MetricHistoryChart } from "@/components/charts/aqi-forecast-chart"
import { calculateAQI } from "@/utils/aqi-calculator"

interface AirQualityCardProps {
  data: AirQualityData
  activeMetric: string | null
  onMetricSelect: (metric: string | null) => void
  onExpand?: () => void
  isOffline?: boolean
}

export function AirQualityCard({ data, activeMetric, onMetricSelect, onExpand, isOffline = false }: AirQualityCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animatedValues, setAnimatedValues] = useState({
    pm25: 0,
    pm10: 0,
    co: 0,
    no2: 0,
    o3: 0,
    so2: 0,
  })
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h")
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Animate values when data changes
  useEffect(() => {
    const duration = 800
    const startTime = Date.now()
    const startValues = { ...animatedValues }

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimatedValues({
        pm25: startValues.pm25 + (data.pm25 - startValues.pm25) * eased,
        pm10: startValues.pm10 + (data.pm10 - startValues.pm10) * eased,
        co: startValues.co + (data.co - startValues.co) * eased,
        no2: startValues.no2 + (data.no2 - startValues.no2) * eased,
        o3: startValues.o3 + (data.o3 - startValues.o3) * eased,
        so2: startValues.so2 + (data.so2 - startValues.so2) * eased,
      })

      if (progress < 1) requestAnimationFrame(animate)
    }

    animate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.pm25, data.pm10, data.co, data.no2, data.o3, data.so2])

  // Calculate Real AQI based on current data
  const aqi = calculateAQI({
    pm25: data.pm25,
    pm10: data.pm10,
    co: data.co / 1000, // Convert ppb to ppm
    no2: data.no2,
    o3: data.o3,
    so2: data.so2,
  })

  // Determine status based on AQI (0-500 scale)
  const getAqiStatus = (aqiValue: number) => {
    if (aqiValue <= 50)
      return {
        text: "Good",
        color: "text-emerald-400",
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
        glow: "shadow-[0_0_20px_rgba(52,211,153,0.4)]",
      }
    if (aqiValue <= 100)
      return {
        text: "Moderate",
        color: "text-amber-400",
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
        glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
      }
    if (aqiValue <= 150)
      return {
        text: "Unhealthy for Sensitive",
        color: "text-orange-400",
        bg: "bg-orange-500/20",
        border: "border-orange-500/30",
        glow: "shadow-[0_0_20px_rgba(251,146,60,0.4)]",
      }
    if (aqiValue <= 200)
      return {
        text: "Unhealthy",
        color: "text-red-400",
        bg: "bg-red-500/20",
        border: "border-red-500/30",
        glow: "shadow-[0_0_20px_rgba(248,113,113,0.4)]",
      }
    if (aqiValue <= 300)
      return {
        text: "Very Unhealthy",
        color: "text-purple-400",
        bg: "bg-purple-500/20",
        border: "border-purple-500/30",
        glow: "shadow-[0_0_20px_rgba(192,132,252,0.4)]",
      }
    return {
      text: "Hazardous",
      color: "text-rose-900",
      bg: "bg-rose-900/20",
      border: "border-rose-900/30",
      glow: "shadow-[0_0_20px_rgba(136,19,55,0.4)]",
    }
  }

  const status = getAqiStatus(aqi)

  return (
    <div
      ref={cardRef}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onExpand && onExpand();
        }
      }}
      onClick={onExpand}
      role="button"
      tabIndex={0}
      className={`card-vibrant relative overflow-hidden rounded-3xl border bg-slate-900/40 p-6 backdrop-blur-xl transition-all duration-1000 cursor-pointer hover:shadow-[0_0_30px_rgba(52,211,153,0.1)] flex flex-col h-full ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        } ${status.border} ${isOffline ? 'opacity-50 blur-[2px] pointer-events-none' : ''}`}
    >
      {isOffline && (
        <div className="absolute top-4 right-4 z-50 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
          OFFLINE
        </div>
      )}
      {/* Background Glow */}
      <div
        className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] transition-colors duration-1000 ${status.bg}`}
      />

      <div className="relative z-10 mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Air Quality Index</h2>
            {onExpand && (
              <button
                onClick={(e) => { e.stopPropagation(); onExpand(); }}
                className="rounded-full bg-white/5 p-1 text-slate-400 hover:text-white transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-6xl font-bold tracking-tighter transition-colors duration-1000 ${status.color
                } drop-shadow-lg`}
            >
              {aqi}
            </span>
            <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
              {status.text}
            </div>
          </div>
        </div>
        <div className={`h-3 w-3 animate-pulse rounded-full ${status.bg.replace('/20', '')} ${status.glow}`} />
      </div>

      {/* Interactive Grid of Pollutants */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { key: "pm25", label: "PM2.5", value: animatedValues.pm25.toFixed(1), unit: "µg/m³", bg: "bg-orange-500", glow: "group-hover:shadow-[0_0_8px_rgba(249,115,22,0.6)]" },
          { key: "pm10", label: "PM10", value: animatedValues.pm10.toFixed(1), unit: "µg/m³", bg: "bg-amber-400", glow: "group-hover:shadow-[0_0_8px_rgba(251,191,36,0.6)]" },
          { key: "co", label: "CO", value: animatedValues.co.toFixed(1), unit: "ppb", bg: "bg-emerald-400", glow: "group-hover:shadow-[0_0_8px_rgba(52,211,153,0.6)]" },
          { key: "no2", label: "NO2", value: animatedValues.no2.toFixed(1), unit: "ppb", bg: "bg-purple-500", glow: "group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)]" },
          { key: "o3", label: "O3", value: animatedValues.o3.toFixed(1), unit: "ppb", bg: "bg-blue-500", glow: "group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)]" },
          { key: "so2", label: "SO2", value: animatedValues.so2.toFixed(1), unit: "ppb", bg: "bg-rose-500", glow: "group-hover:shadow-[0_0_8px_rgba(244,63,94,0.6)]" },
        ].map((item) => (
          <div
            key={item.key}
            onClick={(e) => {
              e.stopPropagation();
              onMetricSelect(item.key);
            }}
            className={`group cursor-pointer relative overflow-hidden rounded-xl border p-3 transition-all duration-300 ${activeMetric === item.key
              ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400 transform scale-[1.02]"
              : "border-white/5 bg-slate-900/40 hover:border-emerald-500/30 hover:bg-slate-800/50 hover:shadow-[0_0_10px_rgba(52,211,153,0.1)]"
              }`}
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <span className={`text-xs uppercase tracking-wider font-semibold transition-colors ${activeMetric === item.key ? "text-emerald-300" : "text-slate-400"
                  }`}>
                  {item.label}
                </span>
                <div className={`w-2 h-2 rounded-full ${item.bg} ${item.glow} transition-all duration-300 shadow-sm`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-mono transition-all duration-300 ${activeMetric === item.key ? "text-white" : "text-slate-200"
                  }`}>
                  {item.value}
                </span>
                <span className="text-[9px] text-slate-500">{item.unit}</span>
              </div>
            </div>
            {activeMetric === item.key && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Embedded History Chart */}
      <div className="mt-4 border-t border-white/5 pt-4 flex-1 min-h-[200px]">
        <MetricHistoryChart
          data={data.chartData.labels.map((l, i) => ({
            label: l,
            pm25: data.chartData.pm25[i],
            pm10: data.chartData.pm10[i],
            co: data.chartData.co[i],
            no2: data.chartData.no2[i],
            o3: data.chartData.o3?.[i] ?? 0,
            so2: data.chartData.so2?.[i] ?? 0
          }))}
          activeMetric={activeMetric}
          onMetricSelect={onMetricSelect}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>
    </div>
  )
}
