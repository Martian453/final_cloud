"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { PrivateDashboard } from "@/components/dashboard/private-dashboard"
import { PublicDashboard } from "@/components/dashboard/public-dashboard"

export default function HomePage() {
    const { token, isLoading } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || isLoading) return <div className="min-h-screen bg-[#020617]" />

    // Routing Logic
    if (token) {
        return <PrivateDashboard />
    } else {
        return <PublicDashboard />
    }
}
