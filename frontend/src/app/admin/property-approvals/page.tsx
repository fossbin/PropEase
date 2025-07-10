"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Building,
  Search,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Home,
  Building2,
  MapPin,
  DollarSign,
  Eye,
  Loader2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Ban,
  Power,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Property {
  id: string
  title: string
  type: string
  transaction_type: string
  is_negotiable: boolean
  status: string
  approval_status: string
  created_at: string
  owner_name: string
  verified: boolean
}

export default function PropertyApprovalsPage() {
  const [pendingProperties, setPendingProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [transactionFilter, setTransactionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pending-properties`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
      })
      const data = await res.json()
      setPendingProperties(data)
    } catch (err) {
      console.error("Failed to load pending properties:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleDisableEnable = async (id: string, currentStatus: string) => {
    setActionLoading(id)
    try {
      const endpoint = currentStatus === "Disabled" ? "enable" : "disable"
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
      })
      await fetchPending()
    } catch (err) {
      console.error("Disable/Enable failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDisable = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(
        selectedProperties.map((id) => {
          const property = pendingProperties.find((p) => p.id === id)
          return handleDisableEnable(id, property?.approval_status || "")
        }),
      )
      setSelectedProperties([])
    } catch (err) {
      console.error("Bulk disable failed:", err)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handlePropertyClick = (id: string) => {
    router.push(`/admin/property-approvals/${id}`)
  }

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "apartment":
        return <Building className="h-4 w-4" />
      case "house":
        return <Home className="h-4 w-4" />
      case "commercial":
        return <Building2 className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "lease":
        return "default"
      case "sale":
        return "secondary"
      case "pg":
        return "outline"
      default:
        return "outline"
    }
  }

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case "Disabled":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Ban className="h-3 w-3 mr-1" />
            Disabled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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

  const filteredProperties = pendingProperties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || property.type.toLowerCase() === typeFilter.toLowerCase()
    const matchesTransaction =
      transactionFilter === "all" || property.transaction_type.toLowerCase() === transactionFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "all" || property.approval_status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesType && matchesTransaction && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(filteredProperties.map((p) => p.id))
    } else {
      setSelectedProperties([])
    }
  }

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, propertyId])
    } else {
      setSelectedProperties(selectedProperties.filter((id) => id !== propertyId))
    }
  }

  const getStats = () => {
    const pending = pendingProperties.filter((p) => p.approval_status === "Pending").length
    const approved = pendingProperties.filter((p) => p.approval_status === "Approved").length
    const disabled = pendingProperties.filter((p) => p.approval_status === "Disabled").length
    const verified = pendingProperties.filter((p) => p.verified).length

    return { pending, approved, disabled, verified }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading properties...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
          <p className="text-muted-foreground">Review, approve, and manage property listings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
            <Ban className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.disabled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transactionFilter} onValueChange={setTransactionFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Transaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="pg">PG</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{selectedProperties.length} properties selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleBulkDisable} disabled={bulkActionLoading}>
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Power className="h-3 w-3 mr-1" />
                )}
                Toggle Status
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {pendingProperties.length === 0 ? "No properties found" : "No properties match your search"}
            </h3>
            <p className="text-muted-foreground">
              {pendingProperties.length === 0
                ? "Properties will appear here once they are submitted."
                : "Try adjusting your search terms or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Properties ({filteredProperties.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedProperties.length === filteredProperties.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => (
                <Card
                  key={property.id}
                  className={`border-l-4 hover:shadow-md transition-shadow ${
                    property.approval_status === "Pending"
                      ? "border-l-orange-500"
                      : property.approval_status === "Approved"
                        ? "border-l-green-500"
                        : property.approval_status === "Rejected"
                          ? "border-l-red-500"
                          : property.approval_status === "Disabled"
                            ? "border-l-gray-500"
                            : "border-l-blue-500"
                  }`}
                >
                  <CardContent className="p-4 space-y-4">
                    {/* Header with Checkbox */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedProperties.includes(property.id)}
                          onCheckedChange={(checked) => handleSelectProperty(property.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg leading-tight">{property.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {getPropertyTypeIcon(property.type)}
                              <span className="ml-1">{property.type}</span>
                            </Badge>
                            <Badge variant={getTransactionTypeColor(property.transaction_type)} className="text-xs">
                              {property.transaction_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {getApprovalStatusBadge(property.approval_status)}
                        {property.verified && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-2">
                      {property.is_negotiable && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Negotiable
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Owner: {property.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(property.created_at)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePropertyClick(property.id)
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant={property.approval_status === "Disabled" ? "default" : "destructive"}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDisableEnable(property.id, property.approval_status)
                        }}
                        disabled={actionLoading === property.id}
                        className="flex-1"
                      >
                        {actionLoading === property.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : property.approval_status === "Disabled" ? (
                          <Power className="h-3 w-3 mr-1" />
                        ) : (
                          <Ban className="h-3 w-3 mr-1" />
                        )}
                        {property.approval_status === "Disabled" ? "Enable" : "Disable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
