"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MapPin,
  Home,
  DollarSign,
  Users,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  AlertTriangle,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface Location {
  address_line: string
  city: string
  state: string
  country: string
  zipcode: string
  latitude: number
  longitude: number
}

interface Property {
  id: string
  title: string
  description: string
  type: string
  status: string
  transaction_type: string
  is_negotiable: boolean
  price: number
  capacity: number
  occupancy: number
  approval_status: string
  verified: boolean
  rating: number | null
  photos: string[]
  location: Location
  created_at: string
  updated_at: string
}

export default function PropertyViewPage() {
  useAuthRedirect()
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/${id}`)
        if (!res.ok) {
          throw new Error("Failed to fetch property")
        }
        const data = await res.json()
        setProperty(data)
      } catch (err) {
        console.error("Error fetching property:", err)
        setError("Failed to load property details")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProperty()
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "unavailable":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getApprovalColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Property not found</h3>
          <p className="text-muted-foreground mb-4">{error || "The property you're looking for doesn't exist."}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const location = property.location
  const mapsSrc =
    location?.latitude && location?.longitude
      ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${location.latitude},${location.longitude}&zoom=15`
      : null

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-muted-foreground">Property Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(property.status)} border`} variant="outline">
            {property.status}
          </Badge>
          {property.verified ? (
            <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
              <CheckCircle className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200" variant="outline">
              <XCircle className="mr-1 h-3 w-3" />
              Unverified
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          {Array.isArray(property.photos) && property.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Property Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {property.photos.map((src: string, i: number) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={src || "/placeholder.svg"}
                        alt={`Property photo ${i + 1}`}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </CardContent>
          </Card>

          {/* Location */}
          {location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="font-medium">{location.address_line}</p>
                  <p className="text-muted-foreground">
                    {location.city}, {location.state}, {location.country} - {location.zipcode}
                  </p>
                </div>

                {mapsSrc && (
                  <div className="rounded-lg overflow-hidden border">
                    <iframe
                      title="Property Location"
                      src={mapsSrc}
                      width="100%"
                      height="300"
                      allowFullScreen
                      loading="lazy"
                      className="border-0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold text-lg">₹{property.price.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{property.type}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction:</span>
                  <Badge variant="outline">{property.transaction_type}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negotiable:</span>
                  <Badge variant={property.is_negotiable ? "secondary" : "outline"}>
                    {property.is_negotiable ? "Yes" : "No"}
                  </Badge>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{property.capacity}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Occupancy:</span>
                  <span>{property.occupancy ?? 0}</span>
                </div>

                {property.rating && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{property.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Approval Status:</span>
                <Badge className={`${getApprovalColor(property.approval_status)} border`} variant="outline">
                  {property.approval_status}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Verification:</span>
                {property.verified ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200" variant="outline">
                    <XCircle className="mr-1 h-3 w-3" />
                    Unverified
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {new Date(property.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Updated: {new Date(property.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
