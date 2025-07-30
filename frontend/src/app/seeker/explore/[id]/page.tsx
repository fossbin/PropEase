"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Users,
  Home,
  Star,
  CheckCircle,
  XCircle,
  IndianRupee,
  Bed,
  Phone,
  Mail,
  Share2,
  Heart,
  ArrowLeft,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Property {
  id: string
  title: string
  type: string
  transaction_type: string
  description: string
  price: number
  capacity: number
  occupancy: number
  photos: string[]
  documents?: string[]
  rating: number | null
  city: string
  address_line: string
  state: string
  country: string
  zipcode: string
  status: string
  owner_id: string
  is_negotiable: boolean
  approval_status: string
  verified: boolean
  latitude?: number
  longitude?: number
}

interface Review {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
}

export default function PropertyDetails() {
  useAuthRedirect()
  const { id } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      setLoading(true)
      try {
        const [propertyRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/seeker/property/${id}`,{
            headers: {
            "Content-Type": "application/json",
            'X-User-Id': sessionStorage.getItem('userId') || '',
          }
          }),
          fetch(`${API_BASE_URL}/api/seeker/review/property/${id}`,{
            headers: {
              "Content-Type": "application/json",
              'X-User-Id': sessionStorage.getItem('userId') || '',
            }
          }),
        ])

        const propertyData = await propertyRes.json()
        const reviewsData = await reviewsRes.json()

        setProperty(propertyData)
        if (Array.isArray(reviewsData)) setReviews(reviewsData)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, API_BASE_URL])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Property not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const {
    title,
    type,
    transaction_type,
    description,
    price,
    capacity,
    occupancy,
    photos,
    rating,
    city,
    address_line,
    state,
    zipcode,
    status,
    is_negotiable,
    verified,
    latitude,
    longitude,
  } = property

  const staticMap =
    latitude && longitude
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      : null

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Available: "default",
      Occupied: "secondary",
      Maintenance: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getApprovalBadge = (approval: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Approved: "default",
      Pending: "secondary",
      Rejected: "destructive",
    }
    return <Badge variant={variants[approval] || "outline"}>{approval}</Badge>
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {photos?.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={photos[selectedImageIndex] || "/placeholder.svg?height=400&width=600"}
                      alt={`Property image ${selectedImageIndex + 1}`}
                      className="w-full h-[400px] object-cover rounded-t-lg"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {photos.length}
                    </div>
                  </div>
                  {photos.length > 1 && (
                    <div className="p-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {photos.map((photo, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                              idx === selectedImageIndex ? "border-primary" : "border-transparent"
                            }`}
                          >
                            <img
                              src={photo || "/placeholder.svg?height=80&width=80"}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-20 h-20 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Property Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {address_line}, {city}, {state} {zipcode}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(status)}
                    {verified ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Details */}
                <div className="flex justify-evenly gap-4 ">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Home className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold">{type}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-semibold">{capacity} people</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Occupancy</p>
                    <p className="font-semibold">
                      {transaction_type == "Lease" || transaction_type == "Sale" ? "N/A" : occupancy / capacity}
                    </p>
                  </div>
                  {transaction_type !== "Sale"? <>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex justify-center">
                      {rating ? (
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No rating</span>
                      )}
                    </div>
                  </div>
                  </>:<></>}
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="font-semibold mb-3">Property Details</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-start gap-2">
                      <span className="text-muted-foreground">Negotiable:</span>
                      <span className="font-medium">{is_negotiable ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            {staticMap && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={staticMap || "/placeholder.svg"}
                    alt="Property location map"
                    className="w-full h-[300px] object-cover rounded-lg border"
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {transaction_type !== "Sale" && (
              reviews.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Reviews ({reviews.length})
                      </CardTitle>
                      {rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">{renderStars(Math.round(rating))}</div>
                          <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">out of 5</span>
                        </div>
                      )}
                    </div>

                    {/* Review Statistics */}
                    <div className="mt-4 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === star).length
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="w-8">{star} ★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-8 text-muted-foreground">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Individual Reviews */}
                    <div className="space-y-4">
                      {reviews
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((review) => (
                          <div
                            key={review.id}
                            className="border rounded-lg p-6 bg-white hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-primary font-semibold text-sm">
                                    {(review.reviewer_name ?? "U").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                                    <span className="text-sm font-medium text-gray-700">{review.rating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(review.created_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-13">
                              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Show More Reviews Button */}
                    {reviews.length > 3 && (
                      <div className="text-center pt-4 border-t">
                        <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                          Show All {reviews.length} Reviews
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* No Reviews State */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h4 className="font-semibold mb-2">No Reviews Yet</h4>
                      <p className="text-muted-foreground text-sm mb-6">
                        Be the first to share your experience with this property
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price & Action */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-3xl font-bold">
                      <IndianRupee className="w-6 h-6" />
                      {price.toLocaleString()}
                    </div>
                    {is_negotiable && <p className="text-sm text-muted-foreground">Negotiable</p>}
                    <p className="text-sm text-muted-foreground">
                      {transaction_type === "Sale"
                        ? "Total Price"
                        : transaction_type === "Lease"
                          ? "Per Month"
                          : "Per Month"}
                    </p>
                  </div>

                  <Button size="lg" className="w-full" onClick={() => router.push(`/seeker/apply/${property.id}`)}>
                    {transaction_type === "Sale"
                      ? "Buy Now"
                      : transaction_type === "Lease"
                        ? "Rent this Property"
                        : "Subscribe to this PG"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
