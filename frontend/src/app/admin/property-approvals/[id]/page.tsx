"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Building,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  FileText,
  ImageIcon,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  Home,
  Building2,
  Loader2,
  AlertTriangle,
  Eye,
  Navigation,
} from "lucide-react"

interface PropertyDetail {
  id: string
  title: string
  description: string
  type: string
  status: string
  transaction_type: string
  is_negotiable: boolean
  capacity: number
  occupancy: number
  price: number
  created_at: string
  approval_status: string
  rejection_reason: string | null
  photos: string[]
  documents: { name: string; path: string }[]
  location: {
    address_line: string
    city: string
    state: string
    country: string
    zipcode: string
    latitude: number
    longitude: number
  }
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/properties/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const data = await res.json()
        setProperty(data)
      } catch (error) {
        console.error("Failed to fetch property details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id])

  const handleApproval = async () => {
    setSubmitting("approve")
    try {
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
      })
      router.push("/admin/property-approvals")
    } catch (error) {
      console.error("Approval failed:", error)
    } finally {
      setSubmitting(null)
    }
  }

  const handleRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    setSubmitting("reject")
    try {
      await fetch(`${API_BASE_URL}/api/admin/properties/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
        body: JSON.stringify({ reason: rejectionReason }),
      })
      router.push("/admin/property-approvals")
    } catch (error) {
      console.error("Rejection failed:", error)
    } finally {
      setSubmitting(null)
    }
  }

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "apartment":
        return <Building className="h-5 w-5" />
      case "house":
        return <Home className="h-5 w-5" />
      case "commercial":
        return <Building2 className="h-5 w-5" />
      default:
        return <Building className="h-5 w-5" />
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openGoogleMaps = () => {
    if (property?.location) {
      const { latitude, longitude } = property.location
      window.open(`https://maps.google.com/?q=${latitude},${longitude}`, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading property details...</span>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Property not found or failed to load.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Property Review</h1>
            <p className="text-muted-foreground">Review and approve property listing</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          ID: {property.id.slice(0, 8)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {getPropertyTypeIcon(property.type)}
                    {property.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTransactionTypeColor(property.transaction_type)}>
                      {property.transaction_type}
                    </Badge>
                    <Badge variant="outline">{property.type}</Badge>
                    {property.is_negotiable && (
                      <Badge variant="secondary">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Negotiable
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(property.price)}</div>
                  <div className="text-sm text-muted-foreground">
                    {property.transaction_type === "rent" ? "per month" : "total price"}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold">{property.capacity}</div>
                  <div className="text-xs text-muted-foreground">Capacity</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold">{property.occupancy}</div>
                  <div className="text-xs text-muted-foreground">Occupied</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Building className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold">{property.status}</div>
                  <div className="text-xs text-muted-foreground">Status</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-semibold">
                    {new Date(property.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div className="text-xs text-muted-foreground">Listed</div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {property.photos && property.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Property Photos ({property.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.photos.map((url, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Property photo ${i + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {property.documents && property.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents ({property.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {property.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(`${SUPABASE_URL}/storage/v1/object/public/property-files/${doc.path}`, "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = `${SUPABASE_URL}/storage/v1/object/public/property-files/${doc.path}`
                            link.download = doc.name
                            link.click()
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">{property.location.address_line}</p>
                <p className="text-muted-foreground">
                  {property.location.city}, {property.location.state}
                </p>
                <p className="text-muted-foreground">
                  {property.location.country} - {property.location.zipcode}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Lat: {property.location.latitude}</p>
                <p>Lng: {property.location.longitude}</p>
              </div>
              <Button size="sm" variant="outline" onClick={openGoogleMaps} className="w-full bg-transparent">
                <Navigation className="h-3 w-3 mr-2" />
                View on Maps
              </Button>
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(property.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval Status:</span>
                <Badge variant="outline">{property.approval_status}</Badge>
              </div>
              {property.rejection_reason && (
                <div>
                  <span className="text-muted-foreground">Rejection Reason:</span>
                  <p className="text-sm mt-1 p-2 bg-red-50 border border-red-200 rounded">
                    {property.rejection_reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
              <CardDescription>Approve or reject this property listing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleApproval}
                disabled={submitting !== null}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {submitting === "approve" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Property
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Provide a detailed reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleRejection}
                disabled={submitting !== null || !rejectionReason.trim()}
                variant="destructive"
                className="w-full"
              >
                {submitting === "reject" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Property
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Property photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white"
              onClick={() => setSelectedImage(null)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
