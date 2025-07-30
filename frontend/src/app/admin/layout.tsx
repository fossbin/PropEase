"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Users,
  FileCheck2,
  BarChart2,
  LifeBuoy,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const adminLinks = [
  { name: "Dashboard", href: "/admin", icon: Home, badge: null },
  { name: "Manage Properties", href: "/admin/property-approvals", icon: FileCheck2, badge: null },
  { name: "Support Tickets", href: "/admin/support", icon: LifeBuoy, badge: null },
  { name: "Manage Users", href: "/admin/users", icon: Users, badge: null },
  { name: "Reviews & Moderation", href: "/admin/reviews", icon: ShieldCheck, badge: null },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userInfo, setUserInfo] = useState({ name: "Admin User", email: "admin@example.com", avatar: "" })

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    if (userId) {
      setUserInfo({
        name: "Admin",
        email: "admin@gmail.com",
        avatar: "",
      })
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("authToken")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userRole")
    router.push("/auth/login")
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const isActiveLink = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 
          ${isCollapsed ? "w-16" : "w-64"} 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
          text-white transition-all duration-300 ease-in-out
          flex flex-col shadow-2xl
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
              </div>
            )}

            {/* Desktop Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-700 p-1"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>

            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 ring-2 ring-blue-500/20">
                <AvatarImage src={userInfo.avatar || "/placeholder.svg"} alt={userInfo.name} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                  {userInfo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userInfo.name}</p>
                <p className="text-xs text-slate-400 truncate">{userInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {adminLinks.map(({ name, href, icon: Icon, badge }) => {
            const isActive = isActiveLink(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <div className="relative">
                  <Icon className={`${isCollapsed ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`} />
                  {isCollapsed && badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-4 h-4 p-0 flex items-center justify-center text-xs"
                    >
                      {badge}
                    </Badge>
                  )}
                </div>

                {!isCollapsed && (
                  <>
                    <span className="flex-1 font-medium">{name}</span>
                    {badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-slate-700 space-y-1">
          {/* {!isCollapsed && (
            <Link
              href="/admin/settings"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium">Settings</span>
            </Link>
          )} */}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg 
              text-red-400 hover:text-red-300 hover:bg-red-500/10 
              transition-all duration-200 group
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <LogOut className={`${isCollapsed ? "w-5 h-5" : "w-4 h-4"} group-hover:scale-110 transition-transform`} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="text-slate-600 hover:text-slate-900">
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
