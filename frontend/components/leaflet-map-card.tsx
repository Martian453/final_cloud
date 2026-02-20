"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icon in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

export interface LocationData {
    location_id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    online: boolean;
    last_seen: string | null;
}

interface LeafletMapCardProps {
    locations?: LocationData[];
}

// Custom icons
const onlineIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const offlineIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapController({ locations }: { locations: LocationData[] }) {
    const map = useMap()

    useEffect(() => {
        const validLocs = locations.filter(l => l.latitude && l.longitude);
        if (validLocs.length > 0) {
            const bounds = L.latLngBounds(validLocs.map(l => [l.latitude!, l.longitude!]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else {
            // Fallback: No valid locations, center on Bangalore
            map.setView([12.9716, 77.5946], 12);
        }
    }, [locations, map])

    return null
}

export function LeafletMapCard({ locations = [] }: LeafletMapCardProps) {
    // Filter only valid locations (Handle null OR undefined)
    const validLocations = locations.filter(l =>
        typeof l.latitude === 'number' &&
        typeof l.longitude === 'number'
    );

    return (
        <div className="card-vibrant relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/60 via-slate-900/50 to-slate-950/70 p-0">
            <div className="absolute left-6 top-6 z-[1000] rounded-xl border border-emerald-500/20 bg-slate-900/80 p-4 backdrop-blur-md">
                <h2 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-sm font-semibold uppercase tracking-[0.2em] text-transparent">
                    Device Map
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    {validLocations.length} Active Locations
                </p>
            </div>

            <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {validLocations.map((loc) => (
                    <Marker
                        key={loc.location_id}
                        position={[loc.latitude!, loc.longitude!]}
                        icon={loc.online ? onlineIcon : offlineIcon}
                    >
                        <Popup>
                            <div className="text-slate-900 font-sans text-xs">
                                <div className="font-bold">{loc.name}</div>
                                <div className={loc.online ? "text-green-600" : "text-slate-500"}>
                                    {loc.online ? "ONLINE" : "OFFLINE"}
                                </div>
                                {loc.last_seen && <div>Last seen: {new Date(loc.last_seen).toLocaleTimeString()}</div>}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapController locations={validLocations} />
            </MapContainer>

            {/* Overlay Gradients */}
            <div className="pointer-events-none absolute inset-0 z-[500] bg-gradient-to-t from-[#050511] via-transparent to-transparent opacity-60" />
            <div className="pointer-events-none absolute inset-0 z-[500] ring-1 ring-inset ring-white/10 rounded-2xl" />
        </div>
    )
}
