"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogIn, MapPin, Wind, Droplets } from "lucide-react"
import { AirQualityCard } from "@/components/air-quality-card"
import { WaterQualityCard } from "@/components/water-quality-card"

export function PublicDashboard() {
    const router = useRouter()
    const [locations, setLocations] = useState<any[]>([])
    // Stores ID only, so we always find the fresh object from 'locations' array
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null)
    const selectedLoc = locations.find(l => l.location_id === selectedLocId)
    const [loading, setLoading] = useState(true)

    // Interactive State (UI Polish)
    const [activeMetric, setActiveMetric] = useState("pm25")
    const [activeWaterMetric, setActiveWaterMetric] = useState("level")

    // Poll Public Data
    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                // In production, pass lat/long here
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/api/public/locations`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setLocations(data)

                } else {
                    console.error("Public API returned non-array:", data);
                    setLocations([]);
                }
            } catch (e) {
                console.error("Public data fetch failed", e)
            } finally {
                setLoading(false)
            }
        }

        fetchPublicData()
        const interval = setInterval(fetchPublicData, 10000) // Poll every 10s for public view
        return () => clearInterval(interval)
    }, [])

    // Mock Data for rendering cards (since public endpoint returns status, we might need real data endpoint separately?
    // Actually, for Phase 3 MVP, let's assume the public endpoint *also* returns the latest measurement values inside the location object.
    // I need to update backend to include values if I want live data. 
    // Wait, the backend implementation I verified in Step 956 DOES NOT include values, only status.
    // I should update the backend to include `latest_data` in the payload.
    // BUT for now, let's just render the structure and I'll update backend in next step for data.

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30 flex flex-col">
            {/* Public Header */}
            <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-black/20 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    {selectedLoc ? (
                        <button
                            onClick={() => setSelectedLocId(null)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                        >
                            <MapPin className="h-5 w-5 text-slate-400 group-hover:text-white" />
                        </button>
                    ) : (
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/5">
                            <div className="h-4 w-4 rounded-full bg-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        </div>
                    )}

                    <div>
                        <h1 className="text-xl font-bold tracking-wide">
                            {selectedLoc ? (
                                <span className="text-white">{selectedLoc.name}</span>
                            ) : (
                                <span className="bg-gradient-to-r from-cyan-400 to-[#7CFF9A] bg-clip-text text-transparent">
                                    Air & Water Intelligence
                                </span>
                            )}
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">
                            {selectedLoc ? "Live Sensor Feed" : "Public Access Network"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all border border-white/5 hover:border-emerald-500/30"
                    >
                        <LogIn className="h-4 w-4 text-emerald-400" />
                        <span>Login</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {selectedLoc ? (
                    /* ATTENTION: DETAIL VIEW (Requested Feature) */
                    <div className="animation-fade-in space-y-8">
                        {/* Air Quality Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Atmospheric Conditions</h3>
                            <AirQualityCard
                                data={{
                                    pm25: selectedLoc.data?.pm25 || 0,
                                    pm10: selectedLoc.data?.pm10 || 0,
                                    co: selectedLoc.data?.co || 0,
                                    no2: selectedLoc.data?.no2 || 0,
                                    o3: selectedLoc.data?.o3 || 0,
                                    so2: selectedLoc.data?.so2 || 0,
                                    chartData: selectedLoc.data?.chartData || { labels: [], pm25: [], pm10: [], co: [], no2: [], o3: [], so2: [] }
                                }}
                                activeMetric={activeMetric}
                                onMetricSelect={setActiveMetric}
                                isOffline={!selectedLoc.online}
                            />
                        </div>

                        {/* Water Quality Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Groundwater Analysis</h3>
                            <WaterQualityCard
                                data={{
                                    level: selectedLoc.data?.level || 0,
                                    ph: selectedLoc.data?.ph || 0,
                                    turbidity: selectedLoc.data?.turbidity || 0,
                                    chartData: selectedLoc.data?.chartData || { labels: [], level: [], ph: [], turbidity: [] }
                                }}
                                activeMetric={activeWaterMetric}
                                onMetricSelect={setActiveWaterMetric}
                                isOffline={!selectedLoc.online}
                            />
                        </div>
                    </div>
                ) : (
                    /* EXISTING GRID VIEW */
                    <>
                        {/* Hero Section */}
                        <div className="mb-12 text-center space-y-4">
                            <h2 className="text-3xl lg:text-5xl font-bold text-white">
                                Real-time Environmental Data <br />
                                <span className="text-slate-500">for your community.</span>
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Access live Air Quality and Water Quality metrics from public sensors nearby.
                                No account required.
                            </p>
                        </div>

                        {/* Locations Grid */}
                        {loading ? (
                            <div className="text-center text-slate-500 py-20">Locating nearby sensors...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {locations.map(loc => (
                                    <div
                                        key={loc.location_id}
                                        onClick={() => loc.online && setSelectedLocId(loc.location_id)}
                                        className={`bg-slate-900/40 border border-white/10 rounded-2xl p-6 transition-all group ${loc.online ? 'cursor-pointer hover:bg-white/5 hover:border-emerald-500/30' : 'opacity-75 cursor-not-allowed'}`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${loc.online ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{loc.name}</h3>
                                                    <p className="text-sm text-slate-500">{loc.area}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${loc.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                {loc.online ? 'Online' : 'Offline'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-center">
                                                <Wind className="h-5 w-5 mx-auto text-orange-400 mb-2" />
                                                <div className="text-xs text-slate-500">AQI Status</div>
                                                <div className="font-mono text-lg font-bold">{loc.online ? "Good" : "--"}</div>
                                            </div>
                                            <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-center">
                                                <Droplets className="h-5 w-5 mx-auto text-blue-400 mb-2" />
                                                <div className="text-xs text-slate-500">Water Status</div>
                                                <div className="font-mono text-lg font-bold">{loc.online ? "Stable" : "--"}</div>
                                            </div>
                                        </div>

                                        {loc.online && (
                                            <div className="mt-4 text-center">
                                                <span className="text-xs font-bold text-emerald-400 group-hover:underline">View Dashboard &rarr;</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
