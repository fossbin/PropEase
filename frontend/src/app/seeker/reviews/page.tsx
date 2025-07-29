"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Star,
  Building,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Send,
  Home,
  Calendar,
  ThumbsUp,
  Edit
} from "lucide-react"

interface ReviewableProperty {
  property_id: string
  title: string
  transaction_type: "Lease" | "PG"
  rating?: number
  comment?: string
  property_type?: string
  start_date?: string
  end_date?: string
  location?: string
}

export default function SeekerReviewsPage() {
  const [properties, setProperties] = useState<ReviewableProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<{ [key: string]: "success" | "error" | null }>({})
  const [reviews, setReviews] = useState<{ [key: string]: { rating: number; comment: string } }>({})

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    fetchReviewables()
  }, [])

  const fetchReviewables = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/seeker/reviewables`, {
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "", 
          "Content-Type": "application/json",
        },
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        const filtered = data.filter((p) => ["Lease", "PG"].includes(p.transaction_type))
        setProperties(filtered)

        // Initialize review state with existing data
        const initialReviews: { [key: string]: { rating: number; comment: string } } = {}
        filtered.forEach((p) => {
          initialReviews[p.property_id] = {
            rating: p.rating || 0,
            comment: p.comment || "",
          }
        })
        setReviews(initialReviews)

        // Initialize submit status for existing reviews
        const initialStatus: { [key: string]: "success" | "error" | null } = {}
        filtered.forEach((p) => {
          if (p.rating && p.rating > 0) {
            initialStatus[p.property_id] = "success"
          } else {
            initialStatus[p.property_id] = null
          }
        })
        setSubmitStatus(initialStatus)
      } else {
        console.error("Expected an array, got:", data)
        setProperties([])
      }
    } catch (err) {
      console.error("Failed to fetch reviewable properties:", err)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }
  const handleSubmit = async (property_id: string) => {
    const review = reviews[property_id]
    if (!review || review.rating < 1 || review.rating > 5) return

    setSubmitting(property_id)
    setSubmitStatus({ ...submitStatus, [property_id]: null })

    try {
      const response = await fetch(`${API_BASE_URL}/api/seeker/review/${property_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "", 
        },
        body: JSON.stringify({ rating: review.rating, comment: review.comment }),
      })

      if (response.ok) {
        setSubmitStatus({ ...submitStatus, [property_id]: "success" })
        fetchReviewables() 
      } else {
        throw new Error('Failed to submit review')
      }
    } catch (err) {
      console.error("Failed to submit review:", err)
      setSubmitStatus({ ...submitStatus, [property_id]: "error" })
    } finally {
      setSubmitting(null)
    }
  }

  const updateReview = (property_id: string, field: "rating" | "comment", value: number | string) => {
    setReviews({
      ...reviews,
      [property_id]: {
        ...reviews[property_id],
        [field]: value,
      },
    })
    
    // Reset submit status when user makes changes to an already submitted review
    if (submitStatus[property_id] === "success") {
      setSubmitStatus({ ...submitStatus, [property_id]: null })
    }
  }

  const renderStarRating = (property_id: string, currentRating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => updateReview(property_id, "rating", star)}
            className="transition-colors duration-200"
          >
            <Star
              className={`h-6 w-6 ${
                star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating > 0 ? `${currentRating} star${currentRating !== 1 ? "s" : ""}` : "Click to rate"}
        </span>
      </div>
    )
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "Lease":
        return <Home className="h-4 w-4" />
      case "PG":
        return <Building className="h-4 w-4" />
      default:
        return <Building className="h-4 w-4" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "Lease":
        return "Lease"
      case "PG":
        return "PG Subscription"
      default:
        return type
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const hasReviewChanged = (property_id: string) => {
    const property = properties.find(p => p.property_id === property_id)
    const currentReview = reviews[property_id]
    
    if (!property || !currentReview) return false
    
    return (
      currentReview.rating !== (property.rating || 0) ||
      currentReview.comment !== (property.comment || "")
    )
  }

  const isReviewSubmitted = (property_id: string) => {
    const property = properties.find(p => p.property_id === property_id)
    return property?.rating && property.rating > 0
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading your properties...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rate Your Properties</h1>
          <p className="text-muted-foreground">Share your experience and help other renters make informed decisions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties to Review</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {properties.filter(p => p.rating && p.rating > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {properties.length > 0
                ? (
                    properties
                      .filter(p => p.rating && p.rating > 0)
                      .reduce((sum, p) => sum + (p.rating || 0), 0) /
                      Math.max(properties.filter(p => p.rating && p.rating > 0).length, 1)
                  ).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" />
            Review Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">What to include:</h4>
              <ul className="space-y-1">
                <li>• Property condition and maintenance</li>
                <li>• Landlord responsiveness</li>
                <li>• Neighborhood and location</li>
                <li>• Value for money</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Keep it helpful:</h4>
              <ul className="space-y-1">
                <li>• Be honest and constructive</li>
                <li>• Focus on facts and experiences</li>
                <li>• Avoid personal information</li>
                <li>• Help future renters decide</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties to review</h3>
            <p className="text-muted-foreground">
              Properties you've rented or subscribed to will appear here for you to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {properties.map((property) => {
            const review = reviews[property.property_id] || { rating: 0, comment: "" }
            const status = submitStatus[property.property_id]
            const isSubmitting = submitting === property.property_id
            const reviewSubmitted = isReviewSubmitted(property.property_id)
            const reviewChanged = hasReviewChanged(property.property_id)

            return (
              <Card key={property.property_id} className={`border-l-4 ${reviewSubmitted && !reviewChanged ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{property.title}</CardTitle>
                        {reviewSubmitted && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getTransactionTypeIcon(property.transaction_type)}
                          <span className="ml-1">{getTransactionTypeLabel(property.transaction_type)}</span>
                        </Badge>
                        {property.property_type && (
                          <Badge variant="secondary" className="text-xs">
                            {property.property_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {property.location && (
                    <CardDescription className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {property.location}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Rental Period */}
                  {(property.start_date || property.end_date) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(property.start_date)} - {formatDate(property.end_date)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Alert */}
                  {status === "success" && !reviewChanged && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {reviewSubmitted ? "Your review has been updated successfully!" : "Thank you! Your review has been submitted successfully."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === "error" && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Failed to submit review. Please try again.</AlertDescription>
                    </Alert>
                  )}

                  {reviewChanged && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        You have unsaved changes to your review.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    {renderStarRating(property.property_id, review.rating)}
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <Label htmlFor={`comment-${property.property_id}`}>Your Review</Label>
                    <Textarea
                      id={`comment-${property.property_id}`}
                      placeholder="Share your experience with this property... What did you like? What could be improved?"
                      value={review.comment}
                      onChange={(e) => updateReview(property.property_id, "comment", e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {review.comment.length}/500 characters
                    </div>
                  </div>

                  <Separator />

                  {/* Submit Button */}
                  <Button
                    onClick={() => handleSubmit(property.property_id)}
                    disabled={isSubmitting || review.rating < 1 || review.rating > 5}
                    className="w-full"
                    variant={reviewChanged ? "default" : status === "success" ? "secondary" : "default"}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {reviewSubmitted ? "Updating Review..." : "Submitting Review..."}
                      </>
                    ) : reviewChanged ? (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {reviewSubmitted ? "Update Review" : "Submit Review"}
                      </>
                    ) : status === "success" ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Review
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}