"use client"

import { useEffect, useState, useRef } from "react"
import { AirQualityCard } from "@/components/air-quality-card"
import { EnvironmentalCore } from "@/components/environmental-core"
import { WaterQualityCard } from "@/components/water-quality-card"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { PollutantDonutChart } from "@/components/charts/pollutant-donut-chart"
import { PredictiveChart } from "@/components/charts/predictive-chart" // NEW IMPORT
import { ChartModal } from "@/components/chart-modal"
import { OfflineBanner } from "@/components/offline-banner"
import dynamic from "next/dynamic"
import { useRealtimeData } from "@/hooks/useRealtimeData"
import { useAuth } from "@/components/auth-provider"
import { Download, Wifi, WifiOff, Cpu, MapPin } from "lucide-react"

// Dynamically import Leaflet map
const LeafletMapCard = dynamic(
    () => import("@/components/leaflet-map-card").then((mod) => mod.LeafletMapCard),
    { ssr: false }
)

export default function Dashboard() {
    const { token, user } = useAuth();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [maxWaterLevel, setMaxWaterLevel] = useState(0)
    const hasAutoSelected = useRef(false); // Track smart auto-selection

    // PRODUCTIZATION STATE
    const [activeMetric, setActiveMetric] = useState("pm25");
    const [activeWaterMetric, setActiveWaterMetric] = useState("level");
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'air' | 'water' | null }>({ isOpen: false, type: null });
    const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h");

    // HYDRATION GUARD INITIALIZATION
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Navigation State
    const [activeView, setActiveView] = useState("dashboard")

    // Location Management
    const [locations, setLocations] = useState<any[]>([])
    const [currentLocation, setCurrentLocation] = useState("")
    const [capabilities, setCapabilities] = useState({ has_aqi: true, has_water: true })

    // Devices State
    const [myDevices, setMyDevices] = useState<any[]>([])

    // Real-Time Data Hook (Pass Token!)
    const { data: wsData, isConnected: wsConnected, isLive, lastMessageTime, isOffline: wsOffline } = useRealtimeData(currentLocation, token);

    // --- DATA STATES (Granular) ---
    const [lastAirTime, setLastAirTime] = useState(0);
    const [lastWaterTime, setLastWaterTime] = useState(0);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update 'currentTime' every second for offline calc
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const isAirOffline = currentTime - lastAirTime > 30000;
    const isWaterOffline = currentTime - lastWaterTime > 30000;

    // Status Logic
    let locationStatus: "ONLINE" | "PARTIAL" | "OFFLINE" = "OFFLINE";
    if (!isAirOffline && !isWaterOffline) locationStatus = "ONLINE";
    else if (!isAirOffline || !isWaterOffline) locationStatus = "PARTIAL";

    const [airData, setAirData] = useState<{
        pm25: number; pm10: number; co: number; no2: number; o3: number; so2: number;
        chartData: { labels: string[], pm25: number[], pm10: number[], co: number[], no2: number[], o3: number[], so2: number[] }
    } | null>(null);

    const [waterData, setWaterData] = useState<{
        level: number; ph: number; turbidity: number;
        chartData: { labels: string[], level: number[], ph: number[], turbidity: number[] }
    } | null>(null);

    // --- ONLINE DETECTION (POLLING /api/locations/status) ---
    const [isSystemOnline, setIsSystemOnline] = useState(false);
    const [locationsStatus, setLocationsStatus] = useState<Record<string, { location_id: string; online: boolean; last_seen: string | null; latitude: number | null; longitude: number | null; name: string }>>({});

    // Helper for API URL
    const getApiUrl = (path: string) => {
        if (typeof window === 'undefined') return `http://localhost:8000${path}`;
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        return `${protocol}//${host}:8000${path}`;
    }

    useEffect(() => {
        if (!token) return;

        const checkStatus = async () => {
            try {
                const res = await fetch(getApiUrl("/api/locations/status"), {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data: Array<{ location_id: string; online: boolean; last_seen: string | null; latitude: number | null; longitude: number | null; name: string }> = await res.json();
                    // Map for easy lookup
                    const statusMap: Record<string, { location_id: string; online: boolean; last_seen: string | null; latitude: number | null; longitude: number | null; name: string }> = {};
                    let anyOnline = false;
                    let currentLocOnline = false;

                    console.log("📍 Status Poll Result:", data);
                    console.log("🎯 Current Location:", currentLocation);

                    data.forEach(loc => {
                        statusMap[loc.location_id] = loc;
                        if (loc.online) {
                            anyOnline = true;
                            console.log(`✅ Location ONLINE: ${loc.name} (${loc.location_id})`);
                        }
                        if (loc.location_id === currentLocation && loc.online) currentLocOnline = true;
                    });

                    console.log(`📊 System Status Decision: Current=${currentLocOnline}, Any=${anyOnline}`);

                    // SMART AUTO-SWITCH LOGIC
                    // If current location is OFFLINE, but we found another one ONLINE, switch to it!
                    if (!currentLocOnline && anyOnline) {
                        const onlineLoc = data.find(l => l.online);
                        if (onlineLoc) {
                            console.log(`🚀 Auto-switching from offline ${currentLocation} to online ${onlineLoc.location_id}`);
                            setCurrentLocation(onlineLoc.location_id);

                            // Reset data states
                            setAirData(null);
                            setWaterData(null);
                            setMaxWaterLevel(0);

                            // Assume new location is online immediately for UI snappiness
                            currentLocOnline = true;
                        }
                    } else if (!hasAutoSelected.current && data.length > 0) {
                        // Initial Load Fallback
                        const firstOnline = data.find(l => l.online);
                        if (firstOnline && (!currentLocation || firstOnline.location_id !== currentLocation)) {
                            console.log("🚀 Initial Auto-select:", firstOnline.location_id);
                            setCurrentLocation(firstOnline.location_id);
                            currentLocOnline = true;
                        }
                        hasAutoSelected.current = true;
                    }

                    setLocationsStatus(statusMap);

                    // Force update if we just auto-switched
                    setIsSystemOnline(currentLocOnline);
                }
            } catch (err) {
                console.warn("Location status poll failed", err);
                setIsSystemOnline(false);
            }
        };

        // Poll every 5 seconds
        const interval = setInterval(checkStatus, 5000);
        checkStatus();

        return () => clearInterval(interval);
    }, [token, currentLocation]);

    // SYSTEM STATUS: Driven by CLIENT SIDE HOOK (Priority) + Polling fallback
    useEffect(() => {
        // If WebSocket hook says we are LIVE, we are definitely online.
        if (isLive && !wsOffline) {
            setIsSystemOnline(true);
        } else {
            // Fallback: If Hook is offline (maybe socket closed), check Polling status
            const locStatus = locationsStatus[currentLocation];
            // If polling says online, we trust it (maybe using HTTP ingest)
            setIsSystemOnline(locStatus?.online || false);
        }
    }, [isLive, wsOffline, locationsStatus, currentLocation]);


    // 1. Fetch Locations on Mount (Auth)
    useEffect(() => {
        if (!token) return;

        fetch(getApiUrl("/api/locations"), {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setLocations(data);
                    // Set default only if not set
                    if (!currentLocation) setCurrentLocation(data[0].name);
                }
            })
            .catch(err => console.error("Failed to fetch locations:", err));
    }, [token]);

    // 2. Clear State on Location Switch
    const handleLocationSelect = (locName: string) => {
        setCurrentLocation(locName);
        setAirData(null);
        setWaterData(null);
        setMaxWaterLevel(0);
        setActiveView("dashboard");

        // Immediate status check for new location from cache
        if (locationsStatus[locName]?.online) {
            setIsSystemOnline(true);
        } else {
            setIsSystemOnline(false);
        }

        // Fetch Capabilities... (existing code)
        if (token) {
            fetch(getApiUrl(`/api/location/${locName}/capabilities`), {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data.has_aqi === 'boolean') {
                        setCapabilities({ has_aqi: data.has_aqi, has_water: data.has_water });
                    } else {
                        // Default to showing everything if endpoint is missing or data is invalid
                        console.warn("Capabilities endpoint missing or invalid, defaulting to FULL DASHBOARD");
                        setCapabilities({ has_aqi: true, has_water: true });
                    }
                })
                .catch((err) => {
                    console.error("Capabilities fetch error:", err);
                    setCapabilities({ has_aqi: true, has_water: true });
                });
        }
    }

    // 3. Fetch Devices... (Existing)
    useEffect(() => {
        if (activeView === "devices" && token) {
            fetch(getApiUrl("/api/devices"), {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setMyDevices(data))
                .catch(err => console.error("Failed devices:", err));
        }
    }, [activeView, token]);

    // 4. Update State... (Existing)
    useEffect(() => {
        if (wsData) {
            console.log(`📉 WS Update [${wsData.type}]:`, wsData.data);
            // Verify if the update belongs to current location (optional if backend handles filtering, but good for debug)
        }

        if (wsData && (wsData.type === 'aqi' || wsData.type === 'aqi_camera')) {
            setAirData(prev => {
                const currentChart = prev?.chartData || { labels: [], pm25: [], pm10: [], co: [], no2: [], o3: [], so2: [] };
                // Use lastMessageTime from hook if available, or current time
                const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                const newLabels = [...currentChart.labels, timeLabel].slice(-100);

                setLastAirTime(Date.now()); // Update last seen for Air

                return {
                    pm25: wsData.data.pm25,
                    pm10: wsData.data.pm10,
                    co: wsData.data.co,
                    no2: wsData.data.no2,
                    o3: wsData.data.o3,
                    so2: wsData.data.so2,
                    chartData: {
                        labels: newLabels,
                        pm25: [...currentChart.pm25, wsData.data.pm25].slice(-100),
                        pm10: [...currentChart.pm10, wsData.data.pm10].slice(-100),
                        co: [...currentChart.co, wsData.data.co].slice(-100),
                        no2: [...currentChart.no2, wsData.data.no2].slice(-100),
                        o3: [...(currentChart.o3 || []), wsData.data.o3].slice(-100),
                        so2: [...(currentChart.so2 || []), wsData.data.so2].slice(-100)
                    }
                };
            });
        } else if (wsData && (wsData.type === 'water' || wsData.type === 'water_sensor')) {
            setWaterData(prev => {
                const currentChart = prev?.chartData || { labels: [], level: [], ph: [], turbidity: [] };
                const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                const newLabels = [...currentChart.labels, timeLabel].slice(-100);

                console.log("💧 Processing Water Data Update -> Level:", wsData.data.level);

                // OFFLINE LOGIC: Check for "Dead Zero" data
                const isZeroWater = wsData.data.level === 0 && wsData.data.ph === 0 && wsData.data.turbidity === 0;

                if (!isZeroWater) {
                    setLastWaterTime(Date.now()); // Update last seen ONLY if valid data
                } else {
                    console.warn("⚠️ Received ZERO Water Data - Not updating heartbeat");
                }

                return {
                    level: wsData.data.level,
                    ph: wsData.data.ph,
                    turbidity: wsData.data.turbidity,
                    chartData: {
                        labels: newLabels,
                        level: [...currentChart.level, wsData.data.level].slice(-100),
                        ph: [...currentChart.ph, wsData.data.ph].slice(-100),
                        turbidity: [...currentChart.turbidity, wsData.data.turbidity].slice(-100)
                    }
                }
            });
        }
    }, [wsData]);

    // Visual Effects... (Existing)
    const [stars, setStars] = useState<Array<{ left: string; top: string; delay: string; duration: string }>>([])
    useEffect(() => {
        if (waterData) setMaxWaterLevel((prev) => Math.max(prev, waterData.level))
    }, [waterData])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 })
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    useEffect(() => {
        setStars(Array.from({ length: 100 }).map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 3}s`,
            duration: `${2 + Math.random() * 2}s`,
        })))
    }, [])

    const safeAirData = airData || {
        pm25: 0, pm10: 0, co: 0, no2: 0, o3: 0, so2: 0,
        chartData: { labels: [], pm25: [], pm10: [], co: [], no2: [], o3: [], so2: [] }
    };
    const safeWaterData = waterData || { level: 0, ph: 0, turbidity: 0, chartData: { labels: [], level: [], ph: [], turbidity: [] } };
    const maxPm25Recorded = airData ? Math.max(airData.pm25, ...(airData.chartData?.pm25 || [])) : 0;

    if (!mounted) return null;

    return (
        <div className={`relative min-h-screen overflow-hidden transition-all duration-1000 ${isSystemOnline ? 'bg-[#050511]' : 'bg-[radial-gradient(circle_at_center,_#0b2a44,_#061a2b)]'}`}>
            {/* Offline Banner */}
            {/* Offline Banner */}
            {/* Passive Offline Badge - Non Blocking */}
            {/* Passive Offline Badge - Non Blocking */}
            {activeView === "dashboard" && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-pulse transition-all duration-500">
                    <div className={`px-4 py-1 rounded-full text-xs font-bold tracking-widest backdrop-blur-md shadow-lg border ${locationStatus === "ONLINE" ? "bg-emerald-500/90 text-white border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]" :
                        locationStatus === "PARTIAL" ? "bg-amber-500/90 text-white border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.5)]" :
                            "bg-red-500/90 text-white border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        }`}>
                        {locationStatus === "ONLINE" ? "LOCATION ONLINE" :
                            locationStatus === "PARTIAL" ? "PARTIAL SYSTEMS OFFLINE" :
                                "LOCATION OFFLINE"} • {new Date().toLocaleTimeString()}
                    </div>
                </div>
            )}

            <SidebarNavigation
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen((v) => !v)}
                locations={locations}
                currentLocationId={currentLocation}
                onLocationSelect={handleLocationSelect}
                activeView={activeView}
                onNavigate={setActiveView}
                locationsStatus={locationsStatus}
            />

            <div className="transition-all duration-700">

                {/* Animated Background */}
                <div className="fixed inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a0520] via-[#050511] to-[#000208]" />
                    {isSystemOnline && (
                        <>
                            <div className="absolute h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-600/20 via-cyan-600/10 to-transparent blur-[100px]" style={{ left: `calc(15% + ${mousePosition.x}px)`, top: `calc(15% + ${mousePosition.y}px)`, transition: "left 0.3s ease-out, top 0.3s ease-out" }} />
                            <div className="animation-delay-2000 absolute h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600/15 via-indigo-600/10 to-transparent blur-[100px]" style={{ right: `calc(10% + ${-mousePosition.x}px)`, top: `calc(20% + ${-mousePosition.y}px)`, transition: "right 0.3s ease-out, top 0.3s ease-out" }} />
                        </>
                    )}
                    <div className="absolute inset-0 opacity-70">
                        {stars.map((star, i) => (
                            <div key={i} className={`absolute h-[2px] w-[2px] rounded-full bg-white ${isSystemOnline ? 'animate-twinkle' : ''}`} style={{ left: star.left, top: star.top, animationDelay: star.delay, animationDuration: star.duration }} />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex min-h-screen flex-col">
                    {/* Header */}
                    <header className="flex items-center justify-between border-b border-white/5 px-6 py-5 backdrop-blur-sm lg:px-10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {/* Logo or Icon could go here */}
                                <div className={`relative h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/5`}>
                                    <div className="h-4 w-4 rounded-full bg-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-wide lg:text-3xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    <span className="bg-gradient-to-r from-cyan-400 to-[#7CFF9A] bg-clip-text text-transparent">
                                        Air & Groundwater Intelligence
                                    </span>
                                </h1>
                            </div>
                            {currentLocation && (
                                <div className="ml-4 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-emerald-400 border border-emerald-500/20">
                                    LOC: {currentLocation}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Header Controls or Empty */}
                        </div>
                    </header>

                    {/* View Switcher */}
                    <main className="flex-1 p-6 lg:p-8">
                        {activeView === "dashboard" ? (
                            <>
                                {/* DASHBOARD VIEW */}
                                <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr_1fr] lg:gap-8">
                                    {/* Col 1 */}
                                    {capabilities.has_aqi && (
                                        <div className={`flex flex-col h-full gap-6 transition-opacity duration-500 ${!airData ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>
                                            <div className="flex-1">
                                                <AirQualityCard
                                                    data={safeAirData}
                                                    activeMetric={activeMetric}
                                                    onMetricSelect={setActiveMetric}
                                                    onExpand={() => setModalConfig({ isOpen: true, type: 'air' })}
                                                    isOffline={isAirOffline}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {/* Col 2 */}
                                    <EnvironmentalCore
                                        aqi={airData?.pm25 ?? 0}
                                        lastUpdate={lastMessageTime ? new Date(lastMessageTime).toLocaleTimeString() : "--:--"}
                                        maxPm25={maxPm25Recorded}
                                        currentPm25={airData?.pm25 ?? 0}
                                        maxWaterLevel={maxWaterLevel}
                                        currentWaterLevel={waterData?.level ?? 0}
                                        isOffline={locationStatus === "OFFLINE"}
                                    />
                                    {/* Col 3 */}
                                    {capabilities.has_water && (
                                        <div className={`flex flex-col gap-6 h-full transition-all duration-500`}>
                                            <div className="flex-[1.5] min-h-[300px]">
                                                <WaterQualityCard
                                                    data={safeWaterData}
                                                    activeMetric={activeWaterMetric}
                                                    onMetricSelect={setActiveWaterMetric}
                                                    onExpand={() => setModalConfig({ isOpen: true, type: 'water' })}
                                                    isOffline={isWaterOffline}
                                                />
                                            </div>
                                            <div className="flex-1 min-h-[250px]"><PollutantDonutChart /></div>
                                        </div>
                                    )}
                                </div>

                                <div className="mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
                                    <div className="h-[350px]">
                                        <div className="h-[350px]">
                                            <PredictiveChart />
                                        </div>
                                    </div>
                                    <div className="h-[350px]"><LeafletMapCard locations={Object.values(locationsStatus)} /></div>
                                </div>
                            </>
                        ) : (
                            /* DEVICES VIEW */
                            <div className="max-w-5xl mx-auto">
                                <h2 className="text-2xl font-bold text-white mb-6">My Hardware Devices</h2>
                                <div className="grid gap-4">
                                    {myDevices.map((dev) => (
                                        <div
                                            key={dev.device_id}
                                            onClick={() => dev.location_id && handleLocationSelect(dev.location_id)}
                                            className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                                                    <Cpu className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-white">{dev.device_id}</div>
                                                    <div className="text-sm text-slate-400 uppercase tracking-widest">{dev.type}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <MapPin className="h-4 w-4 text-blue-400" />
                                                    {dev.location_name}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${dev.status?.toUpperCase() === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                                        {dev.status?.toUpperCase() === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                                                    </div>
                                                    {dev.last_seen && (
                                                        <div className="text-[10px] text-slate-500 font-mono">
                                                            Seen: {new Date(dev.last_seen).toLocaleTimeString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {myDevices.length === 0 && (
                                        <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                                            <p className="text-slate-400">No devices registered. Run the registration script!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* MODAL */}
                <ChartModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    title={modalConfig.type === 'air' ? `Air Quality Analysis: ${activeMetric.toUpperCase()}` : `Water Quality Analysis: ${activeWaterMetric}`}
                    data={modalConfig.type === 'air'
                        ? safeAirData.chartData.labels.map((l, i) => ({
                            time: l,
                            value: safeAirData.chartData[activeMetric as keyof typeof safeAirData.chartData]?.[i] ?? 0
                        }))
                        : safeWaterData.chartData.labels.map((l, i) => ({
                            time: l,
                            value: safeWaterData.chartData[activeWaterMetric as keyof typeof safeWaterData.chartData]?.[i] ?? 0
                        }))
                    }
                    dataKey="value"
                    color={modalConfig.type === 'air' ? '#34d399' : '#22d3ee'}
                />
            </div>
        </div>
    )
}
