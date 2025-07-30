"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Send, Home, Key, Users, Wrench, Star, Search, Heart, MessageSquare, TrendingUp, User } from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface SeekerStats {
  total_applications: number
  total_purchases: number
  total_leases: number
  total_subscriptions: number
  maintenance_tickets: number
  reviews_written: number
}

export default function SeekerDashboardHome() {
  useAuthRedirect()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const [stats, setStats] = useState<SeekerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/seeker/dashboard/stats`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching seeker stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [API_BASE_URL])

  const dashboardCards = [
    {
      title: "Applications Sent",
      value: stats?.total_applications ?? 0,
      description: "Property applications you've made",
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
    {
      title: "Purchased Properties",
      value: stats?.total_purchases ?? 0,
      description: "Sales completed under your name",
      icon: Home,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-100",
    },
    {
      title: "Leased Properties",
      value: stats?.total_leases ?? 0,
      description: "Properties you've leased",
      icon: Key,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
    },
    {
      title: "PG Subscriptions",
      value: stats?.total_subscriptions ?? 0,
      description: "Active or past PG stays",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
    },
    {
      title: "Maintenance Tickets",
      value: stats?.maintenance_tickets ?? 0,
      description: "Issues you've reported",
      icon: Wrench,
      color: "text-red-600",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
    },
    {
      title: "Reviews Written",
      value: stats?.reviews_written ?? 0,
      description: "Properties you've reviewed",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      iconBg: "bg-yellow-100",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Your Property Journey
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Track your property search progress and manage your applications
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : dashboardCards.map((card, index) => (
                <DashboardCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  description={card.description}
                  icon={card.icon}
                  color={card.color}
                  bgColor={card.bgColor}
                  iconBg={card.iconBg}
                />
              ))}
        </div>
      </div>
    </div>
  )
}

function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
  iconBg,
}: {
  title: string
  value: number
  description: string
  icon: any
  color: string
  bgColor: string
  iconBg: string
}) {
  return (
    <Card
      className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${bgColor} group overflow-hidden relative`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          {value > 0 && (
            <Badge variant="secondary" className="text-xs bg-white/80">
              Active
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h3>
          <p className={`text-3xl font-bold ${color} group-hover:scale-105 transition-transform duration-300`}>
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
