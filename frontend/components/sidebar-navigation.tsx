"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider";
import { LayoutDashboard, Sun, Moon, Monitor, X, LogOut, Cpu, Download, MapPin } from "lucide-react"
import { useTheme } from "next-themes"

interface Location {
  id: number;
  name: string;
  display_name?: string;
  latitude?: number;
  longitude?: number;
}

interface SidebarNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  locations?: Location[];
  currentLocationId?: string;
  onLocationSelect?: (locName: string) => void;
  activeView: string;
  onNavigate: (view: string) => void;
  locationsStatus?: Record<string, { online: boolean; last_seen: string | null }>;
}

export function SidebarNavigation({ isOpen, onToggle, locations = [], currentLocationId, onLocationSelect, activeView, onNavigate, locationsStatus = {} }: SidebarNavigationProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme()
  const { user, logout, token } = useAuth();

  // HYDRATION GUARD
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItems = [
    {
      id: "dashboard",
      label: "My Dashboard",
      icon: LayoutDashboard,
      description: "Live Monitoring",
    },
    {
      id: "devices",
      label: "My Devices",
      icon: Cpu,
      description: "Manage Hardware",
    }
  ]

  const handleNavClick = (itemId: string) => {
    onNavigate(itemId)
    if (itemId === "dashboard" || itemId === "devices") onToggle()
  }

  const handleLocationClick = (locName: string) => {
    if (onLocationSelect) {
      onLocationSelect(locName);
      onToggle();
    }
  }

  const handleDownloadCSV = async () => {
    if (!token) return;
    try {
      // Authenticated Backend Export
      const protocol = window.location.protocol;
      const host = window.location.hostname;
      const apiUrl = `${protocol}//${host}:8000/api/export/csv`;

      const res = await fetch(apiUrl, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `env_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (e) {
      console.error("CSV Download failed:", e);
      alert("Failed to download CSV. Ensure you are online.");
    }
  }

  const themes = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ]

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed left-2 top-6 z-[200] flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-800/90 dark:border-white/10 dark:bg-slate-900/90"
        aria-label="Toggle menu"
      >
        <div className="relative h-5 w-5">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-emerald-400 transition-all duration-300 ${isOpen ? "top-2.5 rotate-45" : ""
              }`}
          />
          <span
            className={`absolute left-0 top-2 h-0.5 w-5 rounded-full bg-emerald-400 transition-all duration-300 ${isOpen ? "opacity-0" : ""
              }`}
          />
          <span
            className={`absolute left-0 top-4 h-0.5 w-5 rounded-full bg-emerald-400 transition-all duration-300 ${isOpen ? "top-2.5 -rotate-45" : ""
              }`}
          />
        </div>
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-[150] bg-black/60 transition-all duration-500 ${isOpen ? "opacity-100 backdrop-blur-md" : "pointer-events-none opacity-0 backdrop-blur-none"
          }`}
        onClick={onToggle}
      />

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 z-[200] flex h-screen w-[340px] flex-col border-r border-emerald-500/10 bg-gradient-to-b from-[#0a0f1a]/98 via-[#0d1425]/98 to-[#0a0f1a]/98 shadow-[0_0_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-500 ease-out dark:border-emerald-500/5 ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 animate-pulse rounded-full bg-emerald-500/30 blur-md" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
                <LayoutDashboard className="h-5 w-5 text-black" />
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-white">Environmental</h2>
              <p className="text-xs text-slate-400">Intelligence System</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Menu
          </div>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 ${isActive
                      ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-white"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                    </div>
                  </button>
                </li>
              )
            })}
            {/* Download CSV Item */}
            <li>
              <button
                onClick={handleDownloadCSV}
                className="group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                  <Download className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Download CSV</div>
                </div>
              </button>
            </li>
          </ul>

          {/* MY LOCATIONS */}
          <div className="mt-6">
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              My Locations
            </div>
            {locations.length > 0 ? (
              <ul className="space-y-2">
                {locations.map((loc) => {
                  const isActive = currentLocationId === loc.name;
                  return (
                    <li key={loc.id}>
                      <button
                        onClick={() => handleLocationClick(loc.name)}
                        className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300 ${isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-white border border-blue-500/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                          }`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${isActive ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-500 group-hover:text-white"}`}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{loc.display_name || loc.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${locationsStatus[loc.name]?.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                              {locationsStatus[loc.name]?.online ? 'Active' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="px-4 py-2 text-sm text-slate-500">
                No locations found.
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="mt-8">
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {themes.map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`flex-1 rounded py-2 text-xs font-medium transition-all ${theme === t.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-white/10 p-4 dark:border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.full_name?.[0] || user?.email?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.full_name || "User"}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-500 transition-colors" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
