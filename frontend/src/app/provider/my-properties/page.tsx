"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Pencil,
  Eye,
  CheckCircle,
  Star,
  Trash,
  Plus,
  Home,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Property {
  id: string
  title: string
  type: string
  status: string
  approval_status: string
  price: string
  capacity: number
  created_at: string
  transaction_type: string
  is_negotiable: boolean
  verified: boolean
  rating: number | null
}

export default function MyPropertiesPage() {
  useAuthRedirect()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const fetchProperties = async () => {
      const userId = sessionStorage.getItem("userId")
      if (!userId) return

      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/owned`, {
          headers: {
            "X-User-Id": userId,
          },
        })
        const result = await res.json()
        if (Array.isArray(result)) {
          setProperties(result)
        } else if (Array.isArray(result.data)) {
          setProperties(result.data)
        } else {
          console.error("Invalid response:", result)
          setProperties([])
        }
      } catch (err) {
        console.error("Error fetching properties:", err)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const getApprovalStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getApprovalStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "sold":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDelete = async (id: string) => {
    const userId = sessionStorage.getItem("userId")
    if (!userId) return

    const confirmed = window.confirm("Are you sure you want to delete this property?")
    if (!confirmed) return

    setDeleting(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId,
        },
      })

      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id))
      } else {
        const error = await res.json()
        alert(error.detail || "Failed to delete property.")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      alert("An error occurred while deleting the property.")
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Properties</h2>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Properties</h2>
          <Button asChild>
            <Link href="/provider/add-property">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven't listed any properties yet. Start by adding your first property.
          </p>
          <Button asChild>
            <Link href="/provider/add-property">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Property
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const approvedCount = properties.filter((p) => p.approval_status.toLowerCase() === "approved").length
  const pendingCount = properties.filter((p) => p.approval_status.toLowerCase() === "pending").length
  const rejectedCount = properties.filter((p) => p.approval_status.toLowerCase() === "rejected").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Properties</h2>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Button asChild>
          <Link href="/provider/add-property">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => {
          const isSoldSale =
            property.transaction_type.toLowerCase() === "sale" && property.status.toLowerCase() === "sold"
          const canDelete =
            property.approval_status !== "Approved" ||
            (property.approval_status === "Approved" && property.status.toLowerCase() === "available")

          return (
            <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-lg leading-tight">{property.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{property.type}</span>
                      <span>•</span>
                      <span>{property.transaction_type}</span>
                    </div>
                  </div>
                  <Badge
                    className={`${getApprovalStatusColor(property.approval_status)} border flex items-center gap-1 text-xs`}
                    variant="outline"
                  >
                    {getApprovalStatusIcon(property.approval_status)}
                    {property.approval_status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Property Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">₹{Number(property.price).toLocaleString()}</p>
                      {property.is_negotiable && <p className="text-xs text-muted-foreground">Negotiable</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{property.capacity}</p>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                    </div>
                  </div>
                </div>

                {/* Status and Features */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(property.status)} border text-xs`} variant="outline">
                    {property.status}
                  </Badge>

                  <div className="flex items-center gap-2">
                    {property.verified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Verified</span>
                      </div>
                    )}
                    {property.rating !== null && property.rating !== undefined && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs">{property.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Listed {new Date(property.created_at).toLocaleDateString()}</span>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/provider/my-properties/${property.id}/view`}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Link>
                  </Button>

                  {!isSoldSale && (
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/provider/my-properties/${property.id}/edit`}>
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(property.id)}
                      disabled={deleting === property.id}
                      className="px-3"
                    >
                      {deleting === property.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      ) : (
                        <Trash className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Warning for rejected properties */}
                {property.approval_status.toLowerCase() === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium">Property Rejected</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">Please review and edit your property details.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
