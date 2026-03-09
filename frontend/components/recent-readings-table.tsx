"use client"

import { useEffect, useRef } from "react"

interface RecentReadingsTableProps {
  waterLevels: number[]
  aqiValues: number[]
  labels: string[]
}

export function RecentReadingsTable({ waterLevels, aqiValues, labels }: RecentReadingsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [waterLevels, aqiValues])

  const last5Labels = labels.slice(-5)
  const last5Water = waterLevels.slice(-5)
  const last5Aqi = aqiValues.slice(-5)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Recent Readings
          </h3>
          <p className="text-xs text-slate-500">Last 5 sensor updates</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-400">LIVE DATA</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-1"
      >
        <table className="w-full min-w-[400px] border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Metric
              </th>
              {last5Labels.map((label, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-cyan-400">
                Water Level (ft)
              </td>
              {last5Water.map((value, idx) => (
                <td key={idx} className="px-4 py-3 text-center text-sm font-mono text-white">
                  {value.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-orange-400">
                AQI (PM2.5)
              </td>
              {last5Aqi.map((value, idx) => (
                <td key={idx} className="px-4 py-3 text-center text-sm font-mono text-white">
                  {value.toFixed(1)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-500/10" />
    </div>
  )
}
