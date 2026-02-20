"use client"

import { useEffect, useState } from "react"

export interface ChoroplethLocation {
  location_id: string
  name: string
  latitude: number | null
  longitude: number | null
  online: boolean
  last_seen: string | null
  aqi?: number // PM2.5 value used as AQI indicator
}

interface ChoroplethMapCardProps {
  locations?: ChoroplethLocation[]
}

// AQI -> Color + label
function aqiToColor(aqi: number) {
  if (aqi <= 0) return { color: "rgb(100,116,139)", label: "--" }
  if (aqi <= 12) return { color: "rgb(74,222,128)", label: "Good" }
  if (aqi <= 35.4) return { color: "rgb(250,204,21)", label: "Moderate" }
  if (aqi <= 55.4) return { color: "rgb(251,146,60)", label: "USG" }
  if (aqi <= 150.4) return { color: "rgb(248,113,113)", label: "Unhealthy" }
  if (aqi <= 250.4) return { color: "rgb(192,132,252)", label: "V.Unhealthy" }
  return { color: "rgb(244,63,94)", label: "Hazardous" }
}

export function ChoroplethMapCard({ locations = [] }: ChoroplethMapCardProps) {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLoc({ lat: 12.9716, lng: 77.5946 }), // Fallback: Bangalore
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  const validLocs = locations.filter(
    l => typeof l.latitude === "number" && typeof l.longitude === "number"
  )

  return (
    <div className="relative mt-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/80 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-sm font-semibold uppercase tracking-[0.2em] text-transparent">
          Sensor Status
        </h2>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
          {validLocs.length} {validLocs.length === 1 ? "Sensor" : "Sensors"}
        </div>
      </div>

      {/* Sensor list */}
      <div className="space-y-2">
        {validLocs.length === 0 ? (
          <div className="text-xs text-slate-500">No registered sensors found.</div>
        ) : (
          validLocs.map(loc => {
            const { color, label } = aqiToColor(loc.aqi || 0)
            return (
              <div
                key={loc.location_id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/60 px-4 py-3 text-sm transition-colors hover:border-emerald-500/30 hover:bg-slate-900/80"
              >
                <div className="flex items-center gap-3">
                  {/* Online dot */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${loc.online ? "animate-pulse" : "opacity-40"}`}
                    style={{ backgroundColor: loc.online ? "rgb(74,222,128)" : "rgb(100,116,139)" }}
                  />
                  <div>
                    <div className="font-medium text-white">{loc.name}</div>
                    {loc.last_seen && (
                      <div className="text-[10px] text-slate-500">
                        Last seen: {new Date(loc.last_seen).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {/* AQI badge */}
                  {loc.online && (
                    <div className="rounded-lg border px-2 py-1 text-[11px] font-bold" style={{ borderColor: color + "50", color }}>
                      {loc.aqi ? `PM2.5 ${loc.aqi.toFixed(1)}` : label}
                    </div>
                  )}
                  <span
                    className={`text-xs font-semibold ${loc.online ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {loc.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Your location footer */}
      {userLoc && (
        <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/40 px-4 py-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Your Location · </span>
          <span className="font-mono text-slate-300">{userLoc.lat.toFixed(4)}°, {userLoc.lng.toFixed(4)}°</span>
        </div>
      )}
    </div>
  )
}
