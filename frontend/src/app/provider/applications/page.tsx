"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Eye, Calendar, DollarSign, MessageSquare, User, Home, Clock, FileText } from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Application {
  id: string
  status: string
  message: string
  bid_amount?: number
  lease_start?: string
  lease_end?: string
  subscription_start?: string
  subscription_end?: string
  applicant_name: string
  created_at: string
}

interface PropertyGroup {
  property_id: string
  property_title: string
  property_type: string
  applications: Application[]
}

export default function ProviderApplicationsPage() {
  useAuthRedirect()
  const [groups, setGroups] = useState<PropertyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications/received`, {
          headers: {
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const apps = await res.json()
        const grouped: { [key: string]: PropertyGroup } = {}

        for (const app of apps) {
          const key = app.property_id
          if (!grouped[key]) {
            grouped[key] = {
              property_id: key,
              property_title: app.property_title,
              property_type: app.property_type,
              applications: [],
            }
          }
          grouped[key].applications.push(app)
        }

        setGroups(Object.values(grouped))
      } catch (err) {
        console.error("Failed to load applications:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "approved":
        return <FileText className="h-3 w-3" />
      case "rejected":
        return <FileText className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
        <p className="text-muted-foreground">No applications have been received for your properties.</p>
      </div>
    )
  }

  const totalApplications = groups.reduce((acc, group) => acc + group.applications.length, 0)
  const pendingApplications = groups.reduce(
    (acc, group) => acc + group.applications.filter((app) => app.status.toLowerCase() === "pending").length,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications Received</h1>
          <p className="text-muted-foreground">Manage applications for your properties</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            {totalApplications} total
          </Badge>
          {pendingApplications > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-sm">
              {pendingApplications} pending
            </Badge>
          )}
        </div>
      </div>

      {/* Applications by Property */}
      <div className="space-y-6">
        {groups.map((group) => (
          <Card key={group.property_id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                <div>
                  <span>{group.property_title}</span>
                  <span className="text-sm font-normal text-muted-foreground ml-2">({group.property_type})</span>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {group.applications.length} application{group.applications.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {group.applications.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-muted/25 transition-colors">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{app.applicant_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Applied {format(new Date(app.created_at), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`${getStatusColor(app.status)} border flex items-center gap-1`}
                          variant="outline"
                        >
                          {getStatusIcon(app.status)}
                          {app.status}
                        </Badge>
                      </div>

                      {/* Application Details */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Message */}
                        {app.message && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              Message
                            </div>
                            <p className="text-sm bg-muted/50 rounded-md p-2 line-clamp-2">{app.message}</p>
                          </div>
                        )}

                        {/* Bid Amount */}
                        {app.bid_amount && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              Bid Amount
                            </div>
                            <p className="text-lg font-semibold">₹{app.bid_amount.toLocaleString()}</p>
                          </div>
                        )}

                        {/* Lease Period */}
                        {app.lease_start && app.lease_end && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Lease Period
                            </div>
                            <p className="text-sm">
                              {format(new Date(app.lease_start), "dd MMM yyyy")} -{" "}
                              {format(new Date(app.lease_end), "dd MMM yyyy")}
                            </p>
                          </div>
                        )}

                        {/* Subscription Period */}
                        {app.subscription_start && app.subscription_end && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Subscription Period
                            </div>
                            <p className="text-sm">
                              {format(new Date(app.subscription_start), "dd MMM yyyy")} -{" "}
                              {format(new Date(app.subscription_end), "dd MMM yyyy")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/provider/applications/${app.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
