import { useEffect, useState, useRef } from "react";

type RealtimeData = {
    location_id: string;
    device_id: string;
    type: "aqi" | "water" | "heartbeat" | "water_sensor" | "aqi_camera";
    timestamp: string;
    data: Record<string, number>;
};

export function useRealtimeData(locationId: string, token: string | null) {
    const [data, setData] = useState<RealtimeData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
    const lastMessageRef = useRef<number>(0);

    // Timeout check loop
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            if (lastMessageRef.current > 0 && now - lastMessageRef.current < 20000) {
                if (!isLive) setIsLive(true);
            } else {
                if (isLive) setIsLive(false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isLive]);

    useEffect(() => {
        if (!locationId || !token) {
            setIsLive(false);
            return;
        }

        // Connect to WebSocket with Token (Dynamic Host)
        // Connect to WebSocket with Token
        // Use the Backend URL (not frontend host)
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const wsBase = apiBase.replace(/^http/, "ws"); // http->ws, https->wss
        const wsUrl = `${wsBase}/ws/live/${encodeURIComponent(locationId)}?token=${token}`;
        console.log(`🔌 Connecting to WS: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const payload: RealtimeData = JSON.parse(event.data);
                // console.log("📩 Received Real-Time Data:", payload);

                // Update heartbeat
                lastMessageRef.current = Date.now();
                setLastMessageTime(Date.now());
                setIsLive(true); // Immediate feedback

                if (payload.type !== 'heartbeat') {
                    setData(payload);
                }
            } catch (err) {
                console.error("❌ Error parsing WS message:", err);
            }
        };

        ws.onclose = () => {
            console.log("❌ WebSocket Disconnected");
            setIsConnected(false);
            setIsLive(false);
        };

        return () => {
            ws.close();
        };
    }, [locationId, token]);

    // STABILITY: Pure Client-Side Offline Detection
    const [isOffline, setIsOffline] = useState(true);

    useEffect(() => {
        const checkOffline = () => {
            if (!lastMessageRef.current) {
                setIsOffline(true);
                return;
            }
            const diff = Date.now() - lastMessageRef.current;
            setIsOffline(diff > 30000); // 30s strict timeout
            setIsLive(diff < 30000);
        };

        const interval = setInterval(checkOffline, 2000); // Check every 2s
        checkOffline();

        return () => clearInterval(interval);
    }, []);

    return { data, isConnected, isLive, lastMessageTime, isOffline };
}
