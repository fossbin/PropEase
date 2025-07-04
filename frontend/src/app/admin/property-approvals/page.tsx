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
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Property {
  id: string
  title: string
  type: string
  transaction_type: string
  is_negotiable: boolean
  status: string
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

  const handleVerify = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
      })
      await fetchPending()
    } catch (err) {
      console.error("Verify failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisable = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
      })
      await fetchPending()
    } catch (err) {
      console.error("Disable failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkVerify = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedProperties.map((id) => handleVerify(id)))
      setSelectedProperties([])
    } catch (err) {
      console.error("Bulk verify failed:", err)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDisable = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedProperties.map((id) => handleDisable(id)))
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
      case "rent":
        return "default"
      case "sale":
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

  const filteredProperties = pendingProperties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || property.type.toLowerCase() === typeFilter.toLowerCase()
    const matchesTransaction =
      transactionFilter === "all" || property.transaction_type.toLowerCase() === transactionFilter.toLowerCase()
    return matchesSearch && matchesType && matchesTransaction
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading pending properties...</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Property Approvals</h1>
          <p className="text-muted-foreground">Review and approve pending property listings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingProperties.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pendingProperties.filter((p) => p.verified).length}
            </div>
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
                <SelectItem value="rent">For Rent</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
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
              <Button size="sm" variant="outline" onClick={handleBulkVerify} disabled={bulkActionLoading}>
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Verify All
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDisable} disabled={bulkActionLoading}>
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Ban className="h-3 w-3 mr-1" />
                )}
                Disable All
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
              {pendingProperties.length === 0 ? "No pending properties" : "No properties match your search"}
            </h3>
            <p className="text-muted-foreground">
              {pendingProperties.length === 0
                ? "All properties have been reviewed. Great job!"
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
                Pending Properties ({filteredProperties.length})
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
                <Card key={property.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
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
                          <div className="flex items-center gap-2">
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
                      {property.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
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
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerify(property.id)
                        }}
                        disabled={actionLoading === property.id}
                        className="flex-1"
                      >
                        {actionLoading === property.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {property.verified ? "Unverify" : "Verify"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDisable(property.id)
                        }}
                        disabled={actionLoading === property.id}
                        className="flex-1"
                      >
                        {actionLoading === property.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Ban className="h-3 w-3 mr-1" />
                        )}
                        Disable
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
