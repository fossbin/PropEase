"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Building2, Clock, FileText, DollarSign, Key, Users, Wrench, TrendingUp, Home } from "lucide-react"

interface ProviderStats {
  active_properties: number
  pending_properties: number
  total_applications: number
  total_sales: number
  total_leases: number
  total_subscriptions: number
  pending_maintenance_tickets: number
}

export default function ProviderDashboardHome() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const [stats, setStats] = useState<ProviderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/dashboard/stats`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Failed to load stats", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [API_BASE_URL])

  const dashboardCards = [
    {
      title: "Active Properties",
      value: stats?.active_properties ?? 0,
      description: "Currently listed and available",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
    },
    {
      title: "Pending Approvals",
      value: stats?.pending_properties ?? 0,
      description: "Waiting for admin approval",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
    },
    {
      title: "Applications Received",
      value: stats?.total_applications ?? 0,
      description: "Across all your properties",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
    {
      title: "Sales Completed",
      value: stats?.total_sales ?? 0,
      description: "Properties successfully sold",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-100",
    },
    {
      title: "Active Leases",
      value: stats?.total_leases ?? 0,
      description: "Currently leased properties",
      icon: Key,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
    },
    {
      title: "PG Subscriptions",
      value: stats?.total_subscriptions ?? 0,
      description: "Active PG subscriptions",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-100",
    },
    {
      title: "Pending Maintenance",
      value: stats?.pending_maintenance_tickets ?? 0,
      description: "Tickets raised by tenants",
      icon: Wrench,
      color: "text-red-600",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Provider Dashboard
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Monitor your property portfolio performance and manage your business efficiently
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-md">
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
    <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${iconBg}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          {value > 0 && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h3>
          <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
