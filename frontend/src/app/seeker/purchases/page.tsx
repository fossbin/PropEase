"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  ShoppingBag,
  Home,
  Building,
  Calendar,
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  CreditCard,
  MapPin,
  Eye,
  Ban,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface PurchaseItem {
  id: string
  property_id: string
  title: string
  type: string
  rental_type: "Lease" | "PG" | "Sale"
  start_date?: string
  end_date?: string 
  price: number
  is_active?: boolean
  location?: string
  property_image?: string
  created_at?: string
}

export default function MyPurchasesPage() {
  useAuthRedirect();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cancelStatus, setCancelStatus] = useState<{ [key: string]: "success" | "error" | null }>({})

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/seeker/purchases`, {
          headers: {
            "X-User-Id": sessionStorage.getItem("userId") || "",
            "Content-Type": "application/json",
          },
        })
        const data = await res.json()
        setPurchases(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error loading purchases:", err)
        setPurchases([])
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  const handleCancel = async (id: string, type: "Lease" | "PG") => {
    setCancelling(id)
    setCancelStatus({ ...cancelStatus, [id]: null })

    try {
      await fetch(`${API_BASE_URL}/api/seeker/purchases/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
      })
      setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: false } : p)))
      setCancelStatus({ ...cancelStatus, [id]: "success" })
    } catch (err) {
      console.error("Failed to cancel rental:", err)
      setCancelStatus({ ...cancelStatus, [id]: "error" })
    } finally {
      setCancelling(null)
    }
  }

  const getRentalTypeIcon = (type: string) => {
    switch (type) {
      case "Lease":
        return <Home className="h-4 w-4" />
      case "PG":
        return <Building className="h-4 w-4" />
      case "Sale":
        return <CreditCard className="h-4 w-4" />
      default:
        return <ShoppingBag className="h-4 w-4" />
    }
  }

  const getRentalTypeColor = (type: string) => {
    switch (type) {
      case "Lease":
        return "default"
      case "PG":
        return "secondary"
      case "Sale":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (isActive?: boolean, rentalType?: string) => {
    if (rentalType === "Sale") return <CheckCircle className="h-3 w-3" />
    return isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />
  }

  const getStatusColor = (isActive?: boolean, rentalType?: string) => {
    if (rentalType === "Sale") return "outline"
    return isActive ? "default" : "secondary"
  }

  const getStatusLabel = (isActive?: boolean, rentalType?: string) => {
    if (rentalType === "Sale") return "Purchased"
    return isActive ? "Active" : "Cancelled"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysRemaining = (endDate?: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || purchase.rental_type.toLowerCase() === typeFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (purchase.is_active || purchase.rental_type === "Sale")) ||
      (statusFilter === "cancelled" && !purchase.is_active && purchase.rental_type !== "Sale")

    return matchesSearch && matchesType && matchesStatus
  })

  const totalPurchases = purchases.length
  const activePurchases = purchases.filter((p) => p.is_active || p.rental_type === "Sale").length
  const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0)
  const leases = purchases.filter((p) => p.rental_type === "Lease").length

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading your purchases...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Purchases</h1>
          <p className="text-muted-foreground">Manage your property leases, subscriptions, and purchases</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leases</CardTitle>
            <Home className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{leases}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties, types, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Lease">Lease</SelectItem>
                <SelectItem value="PG">PG</SelectItem>
                <SelectItem value="Sale">Sale</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {purchases.length === 0 ? "No purchases found" : "No purchases match your search"}
            </h3>
            <p className="text-muted-foreground">
              {purchases.length === 0
                ? "Your property leases, subscriptions, and purchases will appear here."
                : "Try adjusting your search terms or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPurchases.map((item) => {
            const status = cancelStatus[item.id]
            const isBeingCancelled = cancelling === item.id
            const daysRemaining = getDaysRemaining(item.end_date)

            return (
              <Card key={item.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRentalTypeColor(item.rental_type)} className="text-xs">
                          {getRentalTypeIcon(item.rental_type)}
                          <span className="ml-1">{item.rental_type}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <Badge variant={getStatusColor(item.is_active, item.rental_type)} className="text-xs">
                          {getStatusIcon(item.is_active, item.rental_type)}
                          <span className="ml-1">{getStatusLabel(item.is_active, item.rental_type)}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(item.price)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.rental_type === "Sale" ? "Purchase price" : "Monthly rent"}
                      </div>
                    </div>
                  </div>
                  {item.location && (
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Alert */}
                  {status === "success" && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {item.rental_type} has been cancelled successfully.
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === "error" && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to cancel {item.rental_type.toLowerCase()}. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Rental Period */}
                  {item.rental_type !== "Sale" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Period:</span>
                        </div>
                        <span className="font-medium">
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </span>
                      </div>

                      {daysRemaining !== null && item.is_active && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Time remaining:</span>
                          </div>
                          <Badge variant={daysRemaining <= 30 ? "destructive" : "default"} className="text-xs">
                            {daysRemaining} days
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purchase Date for Sales */}
                  {item.rental_type === "Sale" && item.created_at && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Purchased:</span>
                      </div>
                      <span className="font-medium">{formatDate(item.created_at)}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>

                    {item.rental_type !== "Sale" && item.is_active && status !== "success" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isBeingCancelled} className="flex-1">
                            {isBeingCancelled ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3 mr-1" />
                                Cancel {item.rental_type}
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel {item.rental_type}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your {item.rental_type.toLowerCase()} for "{item.title}"?
                              This action cannot be undone and may affect your rental history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep {item.rental_type}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(item.id, item.rental_type as "Lease" | "PG")}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Cancel {item.rental_type}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Warning for expiring leases */}
                  {daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0 && item.is_active && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Your {item.rental_type.toLowerCase()} expires in {daysRemaining} days. Consider renewing or
                        finding alternative accommodation.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
