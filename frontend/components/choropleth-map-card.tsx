"use client"

import { useEffect, useState } from "react"

type LocationState =
  | { status: "loading" }
  | { status: "resolved"; lat: number; lng: number; accuracy?: number }
  | { status: "error"; message: string }

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

// AQI -> Color mapping (green to red)
function aqiToColor(aqi: number) {
  if (aqi <= 0) return { fill: "rgba(100,116,139,0.6)", stroke: "rgba(100,116,139,0.8)", label: "--" }
  if (aqi <= 12) return { fill: "rgba(74,222,128,0.7)", stroke: "rgba(74,222,128,1)", label: "Good" }
  if (aqi <= 35.4) return { fill: "rgba(250,204,21,0.7)", stroke: "rgba(250,204,21,1)", label: "Moderate" }
  if (aqi <= 55.4) return { fill: "rgba(251,146,60,0.7)", stroke: "rgba(251,146,60,1)", label: "USG" }
  if (aqi <= 150.4) return { fill: "rgba(248,113,113,0.7)", stroke: "rgba(248,113,113,1)", label: "Unhealthy" }
  if (aqi <= 250.4) return { fill: "rgba(192,132,252,0.7)", stroke: "rgba(192,132,252,1)", label: "V.Unhealthy" }
  return { fill: "rgba(244,63,94,0.7)", stroke: "rgba(244,63,94,1)", label: "Hazardous" }
}

export function ChoroplethMapCard({ locations = [] }: ChoroplethMapCardProps) {
  const [location, setLocation] = useState<LocationState>({ status: "loading" })
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ status: "error", message: "Geolocation not available." })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          status: "resolved",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      () => {
        // Fallback to Bangalore if GPS denied
        setLocation({ status: "resolved", lat: 12.9716, lng: 77.5946 })
      },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  // Filter locations with valid coordinates
  const validLocs = locations.filter(l => typeof l.latitude === "number" && typeof l.longitude === "number")

  // Calculate SVG bounds from all locations + user position
  const allLats: number[] = []
  const allLngs: number[] = []
  validLocs.forEach(l => { allLats.push(l.latitude!); allLngs.push(l.longitude!) })
  if (location.status === "resolved") { allLats.push(location.lat); allLngs.push(location.lng) }

  // Default to Bangalore area if no coords
  const minLat = allLats.length > 0 ? Math.min(...allLats) - 0.05 : 12.85
  const maxLat = allLats.length > 0 ? Math.max(...allLats) + 0.05 : 13.15
  const minLng = allLngs.length > 0 ? Math.min(...allLngs) - 0.05 : 77.45
  const maxLng = allLngs.length > 0 ? Math.max(...allLngs) + 0.05 : 77.75

  const latRange = maxLat - minLat || 0.1
  const lngRange = maxLng - minLng || 0.1

  // Convert lat/lng to SVG coordinates (0-100)
  const toSvg = (lat: number, lng: number) => ({
    x: ((lng - minLng) / lngRange) * 80 + 10,  // 10-90 range with padding
    y: (1 - (lat - minLat) / latRange) * 80 + 10,
  })

  // User marker position
  const userMarker = location.status === "resolved" ? toSvg(location.lat, location.lng) : { x: 50, y: 50 }

  return (
    <div className="card-vibrant relative mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/80 p-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -left-1/4 top-0 h-1/2 w-1/2 animate-blob rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="animation-delay-2000 absolute -right-1/4 bottom-0 h-1/2 w-1/2 animate-blob rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-sm font-semibold uppercase tracking-[0.2em] text-transparent">
            Sensor Map
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Live sensor locations with AQI severity. Blue dot = your position.
          </p>
        </div>

        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
          {validLocs.length} {validLocs.length === 1 ? "Sensor" : "Sensors"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        {/* Map */}
        <div className="relative h-56 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/90">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {/* Background */}
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(15,23,42,1)" />
                <stop offset="70%" stopColor="rgba(15,23,42,0.2)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#mapGlow)" />

            {/* Grid lines */}
            <g stroke="rgba(148,163,184,0.08)" strokeWidth="0.3">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`v-${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
              ))}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
              ))}
            </g>

            {/* Connection lines from user to sensors */}
            {location.status === "resolved" && validLocs.map(loc => {
              const pos = toSvg(loc.latitude!, loc.longitude!)
              return (
                <line
                  key={`line-${loc.location_id}`}
                  x1={userMarker.x} y1={userMarker.y}
                  x2={pos.x} y2={pos.y}
                  stroke="rgba(56,189,248,0.15)"
                  strokeWidth="0.4"
                  strokeDasharray="2,2"
                />
              )
            })}

            {/* Sensor locations */}
            {validLocs.map(loc => {
              const pos = toSvg(loc.latitude!, loc.longitude!)
              const color = aqiToColor(loc.aqi || 0)
              const isHovered = hoveredId === loc.location_id
              const radius = loc.online ? (isHovered ? 6 : 4.5) : 2.5

              return (
                <g
                  key={loc.location_id}
                  onMouseEnter={() => setHoveredId(loc.location_id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  {/* Glow ring */}
                  {loc.online && (
                    <circle
                      cx={pos.x} cy={pos.y} r={radius + 3}
                      fill={color.fill.replace("0.7", "0.15")}
                      className={isHovered ? "" : "animate-pulse"}
                    />
                  )}
                  {/* Main dot */}
                  <circle
                    cx={pos.x} cy={pos.y} r={radius}
                    fill={color.fill}
                    stroke={isHovered ? color.stroke : "rgba(255,255,255,0.2)"}
                    strokeWidth={isHovered ? 1 : 0.5}
                    className="transition-all duration-300"
                  />
                  {/* Label */}
                  {isHovered && (
                    <text
                      x={pos.x} y={pos.y - radius - 3}
                      textAnchor="middle"
                      className="fill-white text-[3.5px] font-bold"
                    >
                      {loc.name} — {loc.online ? `PM2.5: ${loc.aqi?.toFixed(0) ?? "--"}` : "OFFLINE"}
                    </text>
                  )}
                </g>
              )
            })}

            {/* User location marker */}
            {location.status === "resolved" && (
              <g>
                <circle cx={userMarker.x} cy={userMarker.y} r={6} fill="rgba(56,189,248,0.12)" />
                <circle cx={userMarker.x} cy={userMarker.y} r={2.5} fill="rgba(56,189,248,1)" className="animate-pulse" />
              </g>
            )}
          </svg>
        </div>

        {/* Side legend */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Sensor Status
            </h3>
            <div className="mt-2 space-y-2">
              {validLocs.length === 0 ? (
                <div className="text-xs text-slate-500">No registered sensors</div>
              ) : validLocs.map(loc => {
                const color = aqiToColor(loc.aqi || 0)
                return (
                  <button
                    key={loc.location_id}
                    onMouseEnter={() => setHoveredId(loc.location_id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left text-[11px] transition-all duration-200 ${hoveredId === loc.location_id
                        ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                        : "border-white/5 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:bg-slate-900/80"
                      }`}
                  >
                    <span className="truncate">{loc.name}</span>
                    <span className="ml-2 flex items-center gap-1 text-[10px]">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: color.fill.replace("0.7", "1") }}
                      />
                      <span style={{ color: color.stroke }}>
                        {loc.online ? color.label : "Offline"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-[11px] text-slate-300">
            {location.status === "resolved" ? (
              <>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Your Location
                </div>
                <div className="font-mono text-xs text-slate-200">
                  {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
                </div>
                {location.accuracy && (
                  <div className="mt-1 text-[10px] text-slate-500">
                    Accuracy ~ {Math.round(location.accuracy)} m
                  </div>
                )}
              </>
            ) : location.status === "loading" ? (
              <div className="text-slate-400">Requesting location…</div>
            ) : (
              <div className="text-slate-400">
                Location denied. Showing Bangalore default.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
