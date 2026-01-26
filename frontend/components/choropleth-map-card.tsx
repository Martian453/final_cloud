"use client"

import { useEffect, useState } from "react"

type LocationState =
  | { status: "loading" }
  | { status: "resolved"; lat: number; lng: number; accuracy?: number }
  | { status: "error"; message: string }

interface Region {
  id: string
  name: string
  value: number
  polygon: string // SVG points
}

// Simple color scale between two CSS variables
function valueToColor(value: number) {
  // value 0–100 -> 0–1
  const t = Math.max(0, Math.min(1, value / 100))
  // Use two CSS variables as fallbacks
  const start = "rgba(124,255,154,"
  const end = "rgba(255,107,107,"
  const r1 = 124
  const g1 = 255
  const b1 = 154
  const r2 = 255
  const g2 = 107
  const b2 = 107

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `rgba(${r},${g},${b},`
}

export function ChoroplethMapCard() {
  const [location, setLocation] = useState<LocationState>({ status: "loading" })
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ status: "error", message: "Geolocation not available in this browser." })
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
        // Fallback to a generic location (e.g., Delhi region) if permission denied
        setLocation({
          status: "resolved",
          lat: 28.6139,
          lng: 77.209,
        })
      },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  // Define a simple "map" as 5 regions in an abstracted grid (choropleth-style)
  const regions: Region[] = [
    {
      id: "north",
      name: "North Region",
      value: 42,
      polygon: "20,10 80,10 80,30 20,30",
    },
    {
      id: "south",
      name: "South Region",
      value: 65,
      polygon: "20,70 80,70 80,90 20,90",
    },
    {
      id: "east",
      name: "East Region",
      value: 55,
      polygon: "60,30 90,30 90,70 60,70",
    },
    {
      id: "west",
      name: "West Region",
      value: 35,
      polygon: "10,30 40,30 40,70 10,70",
    },
    {
      id: "central",
      name: "Central Hub",
      value: 48,
      polygon: "40,35 60,35 60,65 40,65",
    },
  ]

  // Convert lat/lng to SVG coordinates (very rough equirectangular projection)
  const getMarkerPosition = () => {
    if (location.status !== "resolved") {
      return { x: 50, y: 50 }
    }
    const { lat, lng } = location
    const x = ((lng + 180) / 360) * 100
    const y = (1 - (lat + 90) / 180) * 100
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    }
  }

  const marker = getMarkerPosition()

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
            Choropleth Map
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Filled regions show relative environmental load. Marker indicates your approximate location.
          </p>
        </div>

        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
          {location.status === "loading" && "Locating..."}
          {location.status === "error" && "Location Approx."}
          {location.status === "resolved" && "Location Live"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        {/* Map */}
        <div className="relative h-56 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/90">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {/* Starry background */}
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(15,23,42,1)" />
                <stop offset="70%" stopColor="rgba(15,23,42,0.2)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#mapGlow)" />

            {/* Regions */}
            {regions.map((region) => {
              const baseColor = valueToColor(region.value)
              const isHovered = hoveredRegion === region.id
              const fill = isHovered ? `${baseColor}0.9)` : `${baseColor}0.6)`
              const stroke = isHovered ? `${baseColor}1)` : "rgba(148,163,184,0.5)"
              return (
                <polygon
                  key={region.id}
                  points={region.polygon}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHovered ? 1.5 : 1}
                  className="transition-all duration-300"
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              )
            })}

            {/* Current location marker */}
            <g>
              <circle
                cx={marker.x}
                cy={marker.y}
                r={2.5}
                fill="rgba(56,189,248,1)"
                className="animate-pulse"
              />
              <circle cx={marker.x} cy={marker.y} r={6} fill="rgba(56,189,248,0.12)" />
            </g>

            {/* Subtle grid */}
            <g stroke="rgba(148,163,184,0.15)" strokeWidth="0.3">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`v-${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
              ))}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
              ))}
            </g>
          </svg>
        </div>

        {/* Side legend */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Region Intensities
            </h3>
            <div className="mt-2 space-y-2">
              {regions.map((region) => (
                <button
                  key={region.id}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left text-[11px] transition-all duration-200 ${
                    hoveredRegion === region.id
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                      : "border-white/5 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:bg-slate-900/80"
                  }`}
                >
                  <span className="truncate">{region.name}</span>
                  <span className="ml-2 flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400" />
                    {region.value}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-[11px] text-slate-300">
            {location.status === "resolved" ? (
              <>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Current Location
                </div>
                <div className="font-mono text-xs text-slate-200">
                  {location.lat.toFixed(3)}°, {location.lng.toFixed(3)}°
                </div>
                {location.accuracy && (
                  <div className="mt-1 text-[10px] text-slate-500">
                    Accuracy ~ {Math.round(location.accuracy)} m
                  </div>
                )}
              </>
            ) : location.status === "loading" ? (
              <div className="text-slate-400">Requesting browser location…</div>
            ) : (
              <div className="text-slate-400">
                Location permissions denied. Showing approximate reference position.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

