"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Eye,
  Trash2,
  Filter,
  Loader2,
  AlertTriangle,
  Building,
  User,
} from "lucide-react"

interface Application {
  id: string
  property_title: string
  status: "Pending" | "Approved" | "Rejected"
  message: string
  created_at: string
  property_id?: string
  property_type?: string
  bid_amount?: number
  lease_start?: string
  lease_end?: string
  subscription_start?: string
  subscription_end?: string
  rejection_reason?: string
  owner_name?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [withdrawing, setWithdrawing] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const showSuccess = searchParams.get("success") === "true"

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  const loadApplications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/sent`, {
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
      })
      const result = await res.json()
      if (Array.isArray(result)) {
        setApplications(result)
      } else if (Array.isArray(result.data)) {
        setApplications(result.data)
      } else {
        console.error("Unexpected response format:", result)
        setApplications([])
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications/sent`, {
          headers: {
            "X-User-Id": sessionStorage.getItem("userId") || "",
            "Content-Type": "application/json",
          },
        })
        const result = await res.json()

        if (Array.isArray(result)) {
          setApplications(result || [])
        } else if (Array.isArray(result.data)) {
          setApplications(result.data || [])
        } else {
          console.error("Unexpected response format:", result)
          setApplications([])
        }
        await loadApplications()
      } catch (err) {
        console.error("Failed to fetch applications:", err)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawing(applicationId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        throw new Error("Failed to withdraw")
      }

      // Refresh list after successful deletion
      await loadApplications()
    } catch (err) {
      console.error("Failed to withdraw application:", err)
    } finally {
      setWithdrawing(null)
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-3 w-3" />
      case "Rejected":
        return <XCircle className="h-3 w-3" />
      case "Pending":
        return <Clock className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Rejected":
        return "destructive"
      case "Pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return null
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.property_title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (app.message?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (app.owner_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || app.status?.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })


  // Statistics
  const totalApplications = applications.length
  const pendingApplications = applications.filter((app) => app.status === "Pending").length
  const approvedApplications = applications.filter((app) => app.status === "Approved").length
  const rejectedApplications = applications.filter((app) => app.status === "Rejected").length

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading your applications...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track the status of your property applications</p>
        </div>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your application has been submitted successfully! You'll be notified when the owner responds.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedApplications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties, messages, or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {applications.length === 0 ? "No applications submitted" : "No applications match your search"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {applications.length === 0
                ? "Start exploring properties and submit your first application."
                : "Try adjusting your search terms or filters."}
            </p>
            {applications.length === 0 && (
              <Button onClick={() => (window.location.href = "/seeker/explore")}>
                <Building className="h-4 w-4 mr-2" />
                Explore Properties
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{app.property_title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(app.status)} className="text-xs">
                        {getStatusIcon(app.status)}
                        <span className="ml-1">{app.status}</span>
                      </Badge>
                      {app.property_type && (
                        <Badge variant="outline" className="text-xs">
                          {app.property_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Applied on {formatDate(app.created_at)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Message Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <MessageSquare className="h-3 w-3" />
                    Your Message
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {app.message || "No message provided"}
                  </p>
                </div>

                {/* Additional Details */}
                {(app.bid_amount || app.lease_start || app.subscription_start) && (
                  <div className="space-y-2">
                    {app.bid_amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bid Amount:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(app.bid_amount)}</span>
                      </div>
                    )}
                    {(app.lease_start || app.subscription_start) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Period:</span>
                        <span className="font-medium">
                          {new Date(app.lease_start || app.subscription_start || "").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(app.lease_end || app.subscription_end || "").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Owner Info */}
                {app.owner_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-medium">{app.owner_name}</span>
                  </div>
                )}

                {/* Rejection Reason */}
                {app.status === "Rejected" && app.rejection_reason && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rejection Reason:</strong> {app.rejection_reason}
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{app.property_title}</DialogTitle>
                        <DialogDescription>Application submitted on {formatDate(app.created_at)}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(app.status)}>
                            {getStatusIcon(app.status)}
                            <span className="ml-1">{app.status}</span>
                          </Badge>
                          {app.property_type && <Badge variant="outline">{app.property_type}</Badge>}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-1">Your Message</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{app.message}</p>
                          </div>

                          {app.bid_amount && (
                            <div>
                              <h4 className="font-medium mb-1">Bid Amount</h4>
                              <p className="text-sm font-medium text-blue-600">{formatCurrency(app.bid_amount)}</p>
                            </div>
                          )}

                          {(app.lease_start || app.subscription_start) && (
                            <div>
                              <h4 className="font-medium mb-1">
                                {app.lease_start ? "Lease Period" : "Subscription Period"}
                              </h4>
                              <p className="text-sm">
                                {formatDate(app.lease_start || app.subscription_start || "")} -{" "}
                                {formatDate(app.lease_end || app.subscription_end || "")}
                              </p>
                            </div>
                          )}

                          {app.owner_name && (
                            <div>
                              <h4 className="font-medium mb-1">Property Owner</h4>
                              <p className="text-sm">{app.owner_name}</p>
                            </div>
                          )}

                          {app.status === "Rejected" && app.rejection_reason && (
                            <div>
                              <h4 className="font-medium mb-1 text-red-600">Rejection Reason</h4>
                              <p className="text-sm text-red-600">{app.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {app.status === "Pending" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={withdrawing === app.id} className="flex-1">
                          {withdrawing === app.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Withdrawing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Withdraw
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to withdraw your application for "{app.property_title}"? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Application</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleWithdraw(app.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Withdraw Application
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Status-specific messages */}
                {app.status === "Approved" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Congratulations! Your application has been approved. The owner will contact you soon.
                    </AlertDescription>
                  </Alert>
                )}

                {app.status === "Pending" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your application is under review. You'll be notified once the owner makes a decision.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
