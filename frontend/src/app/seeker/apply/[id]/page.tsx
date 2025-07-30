"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Home,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Send,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  ExternalLink,
  ImageIcon,
  User,
  Clock,
  Shield,
  Info,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Property {
  id: string
  title: string
  price: number
  photos: string[]
  city: string
  transaction_type: string
  description?: string
  address?: string
  amenities?: string[]
  owner_name?: string
  is_negotiable?: boolean
}

interface UserDocument {
  id: string
  document_url: string
  document_type: string
  verified: boolean
  uploaded_at?: string
}

interface ValidationErrors {
  [key: string]: string
}

interface FormData {
  message: string
  bidAmount: string
  leaseStart: string
  leaseEnd: string
  subscriptionStart: string
  subscriptionEnd: string
}

export default function ApplyPropertyPage() {
  useAuthRedirect()
  const { id } = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  // Form state
  const [formData, setFormData] = useState<FormData>({
    message: "",
    bidAmount: "",
    leaseStart: "",
    leaseEnd: "",
    subscriptionStart: "",
    subscriptionEnd: "",
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertyRes, profileRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/seeker/property/${id}`, {
            headers: {
              "X-User-Id": sessionStorage.getItem("userId") || "",
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
              "X-User-Id": sessionStorage.getItem("userId") || "",
              "Content-Type": "application/json",
            },
          }),
        ])

        if (!propertyRes.ok || !profileRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const propertyData = await propertyRes.json()
        const profileData = await profileRes.json()
        setProperty(propertyData)
        setUserDocuments(profileData.user_documents || [])
      } catch (err) {
        console.error("Error loading data:", err)
        setFormErrors({ general: "Failed to load property data. Please try again." })
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id, API_BASE_URL])

  // Real-time validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "message":
        if (!value.trim()) return "Message is required"
        if (value.trim().length < 10) return "Message should be at least 10 characters"
        if (value.length > 500) return "Message cannot exceed 500 characters"
        if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(value)) return "Message contains invalid characters"
        return ""

      case "bidAmount":
        if (value && (!value.match(/^\d+(\.\d{1,2})?$/) || Number(value) <= 0)) {
          return "Bid amount must be a valid positive number"
        }
        if (value && Number(value) > 10000000) {
          return "Bid amount seems unreasonably high"
        }
        if (property && value && Number(value) < property.price * 0.1) {
          return "Bid amount is significantly lower than asking price"
        }
        return ""

      case "leaseStart":
      case "subscriptionStart":
        if (property?.transaction_type === "Lease" && name === "leaseStart" && !value) {
          return "Lease start date is required"
        }
        if (property?.transaction_type === "PG" && name === "subscriptionStart" && !value) {
          return "Subscription start date is required"
        }
        if (value) {
          const selectedDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (selectedDate < today) {
            return "Start date cannot be in the past"
          }

          const maxFutureDate = new Date()
          maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2)
          if (selectedDate > maxFutureDate) {
            return "Start date cannot be more than 2 years in the future"
          }
        }
        return ""

      case "leaseEnd":
      case "subscriptionEnd":
        const startField = name === "leaseEnd" ? "leaseStart" : "subscriptionStart"
        const startDate = formData[startField as keyof FormData]

        if (property?.transaction_type === "Lease" && name === "leaseEnd" && !value) {
          return "Lease end date is required"
        }
        if (property?.transaction_type === "PG" && name === "subscriptionEnd" && !value) {
          return "Subscription end date is required"
        }

        if (value && startDate) {
          const start = new Date(startDate)
          const end = new Date(value)

          if (end <= start) {
            return "End date must be after start date"
          }

          const diffTime = Math.abs(end.getTime() - start.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (property?.transaction_type === "Lease" && diffDays < 30) {
            return "Lease period should be at least 30 days"
          }
          if (property?.transaction_type === "PG" && diffDays < 7) {
            return "Subscription period should be at least 7 days"
          }
          if (diffDays > 1095) {
            // 3 years
            return "Period cannot exceed 3 years"
          }
        }
        return ""

      default:
        return ""
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value)
      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }))
    }
  }

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name as keyof FormData])
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    const fields = Object.keys(formData) as (keyof FormData)[]

    fields.forEach((field) => {
      const error = validateField(field, formData[field])
      if (error) errors[field] = error
    })

    // Additional cross-field validation
    if (property?.transaction_type === "Lease") {
      if (!formData.leaseStart) errors.leaseStart = "Lease start date is required"
      if (!formData.leaseEnd) errors.leaseEnd = "Lease end date is required"
    }

    if (property?.transaction_type === "PG") {
      if (!formData.subscriptionStart) errors.subscriptionStart = "Subscription start date is required"
      if (!formData.subscriptionEnd) errors.subscriptionEnd = "Subscription end date is required"
    }

    // Check if user has any documents for better application
    if (userDocuments.length === 0) {
      errors.documents = "Consider uploading documents to strengthen your application"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const sanitizeFormData = () => {
    return {
      message: formData.message.trim(),
      bidAmount: formData.bidAmount.trim(),
      leaseStart: formData.leaseStart,
      leaseEnd: formData.leaseEnd,
      subscriptionStart: formData.subscriptionStart,
      subscriptionEnd: formData.subscriptionEnd,
    }
  }

  const handleSubmit = async () => {
    // Mark all fields as touched for validation display
    const allFields = Object.keys(formData)
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}))

    if (!validateForm()) {
      setFormErrors((prev) => ({
        ...prev,
        submit: "Please fix the errors above before submitting",
      }))
      return
    }

    const sanitizedData = sanitizeFormData()
    const submitFormData = new FormData()

    submitFormData.append("message", sanitizedData.message)

    if (sanitizedData.bidAmount) {
      submitFormData.append("bid_amount", sanitizedData.bidAmount)
    }

    if (property?.transaction_type === "Lease") {
      submitFormData.append("lease_start", new Date(sanitizedData.leaseStart).toISOString().split("T")[0])
      submitFormData.append("lease_end", new Date(sanitizedData.leaseEnd).toISOString().split("T")[0])
    }

    if (property?.transaction_type === "PG") {
      submitFormData.append("subscription_start", new Date(sanitizedData.subscriptionStart).toISOString().split("T")[0])
      submitFormData.append("subscription_end", new Date(sanitizedData.subscriptionEnd).toISOString().split("T")[0])
    }

    setSubmitting(true)
    setFormErrors({}) // Clear previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/apply/${id}`, {
        method: "POST",
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
        body: submitFormData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      router.push("/seeker/applications?success=true")
    } catch (err) {
      console.error("Failed to apply:", err)
      setFormErrors({
        submit: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case "Lease":
        return <Home className="h-5 w-5" />
      case "PG":
        return <Building className="h-5 w-5" />
      case "Sale":
        return <MapPin className="h-5 w-5" />
      default:
        return <Home className="h-5 w-5" />
    }
  }

  const getPropertyTypeColor = (type: string) => {
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

  const getInputClassName = (fieldName: string) => {
    const hasError = formErrors[fieldName]
    const isTouched = touched[fieldName]

    if (hasError && isTouched) return "border-red-500 focus:border-red-500"
    if (isTouched && !hasError) return "border-green-500 focus:border-green-500"
    return ""
  }

  const isLease = property?.transaction_type === "Lease"
  const isSale = property?.transaction_type === "Sale"
  const isPG = property?.transaction_type === "PG"
  const verifiedDocs = userDocuments.filter((doc) => doc.verified).length
  const totalDocs = userDocuments.length

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading property details...</span>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{formErrors.general || "Property not found or failed to load."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Apply for Property</h1>
            <p className="text-muted-foreground">Submit your application for this property</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {getPropertyTypeIcon(property.transaction_type)}
                    {property.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPropertyTypeColor(property.transaction_type)}>{property.transaction_type}</Badge>
                    {property.is_negotiable && (
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Negotiable
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(property.price)}</div>
                  <div className="text-sm text-muted-foreground">{isSale ? "Total price" : "Monthly rent"}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.city}</span>
                {property.address && <span>• {property.address}</span>}
              </div>
              {property.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </div>
              )}
              {property.owner_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Owner:</span>
                  <span className="font-medium">{property.owner_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Photos */}
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
                  {property.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border"
                      onClick={() => setSelectedImage(photo)}
                    >
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Property photo ${index + 1}`}
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

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Application Form
              </CardTitle>
              <CardDescription>Fill out the form below to submit your application for this property.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {formErrors.submit && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{formErrors.submit}</AlertDescription>
                </Alert>
              )}

              {/* Document Warning */}
              {formErrors.documents && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{formErrors.documents}</AlertDescription>
                </Alert>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message to Property Owner <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain why you're interested in this property..."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  onBlur={() => handleBlur("message")}
                  rows={4}
                  maxLength={500}
                  className={getInputClassName("message")}
                />
                <div className="flex justify-between text-xs">
                  <span className="text-red-500">{touched.message && formErrors.message && formErrors.message}</span>
                  <span className="text-muted-foreground">{formData.message.length}/500 characters</span>
                </div>
              </div>

              {/* Bid Amount */}
              {(isLease || isSale) && (
                <div className="space-y-2">
                  <Label htmlFor="bidAmount">{isSale ? "Offer Amount" : "Bid Amount"} (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bidAmount"
                      type="text"
                      placeholder={`Enter your ${isSale ? "offer" : "bid"} amount`}
                      value={formData.bidAmount}
                      onChange={(e) => handleInputChange("bidAmount", e.target.value)}
                      onBlur={() => handleBlur("bidAmount")}
                      className={`pl-9 ${getInputClassName("bidAmount")}`}
                    />
                  </div>
                  {touched.bidAmount && formErrors.bidAmount && (
                    <p className="text-xs text-red-500">{formErrors.bidAmount}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {property.is_negotiable
                      ? "This property is negotiable. You can propose a different amount."
                      : "Optional: Propose a different amount if you wish to negotiate."}
                  </p>
                </div>
              )}

              {/* Lease Dates */}
              {isLease && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Label className="text-base font-medium">Lease Period</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leaseStart">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="leaseStart"
                        type="date"
                        value={formData.leaseStart}
                        onChange={(e) => handleInputChange("leaseStart", e.target.value)}
                        onBlur={() => handleBlur("leaseStart")}
                        min={new Date().toISOString().split("T")[0]}
                        className={getInputClassName("leaseStart")}
                      />
                      {touched.leaseStart && formErrors.leaseStart && (
                        <p className="text-xs text-red-500">{formErrors.leaseStart}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseEnd">
                        End Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="leaseEnd"
                        type="date"
                        value={formData.leaseEnd}
                        onChange={(e) => handleInputChange("leaseEnd", e.target.value)}
                        onBlur={() => handleBlur("leaseEnd")}
                        min={formData.leaseStart || new Date().toISOString().split("T")[0]}
                        className={getInputClassName("leaseEnd")}
                      />
                      {touched.leaseEnd && formErrors.leaseEnd && (
                        <p className="text-xs text-red-500">{formErrors.leaseEnd}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Dates */}
              {isPG && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Label className="text-base font-medium">Subscription Period</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionStart">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subscriptionStart"
                        type="date"
                        value={formData.subscriptionStart}
                        onChange={(e) => handleInputChange("subscriptionStart", e.target.value)}
                        onBlur={() => handleBlur("subscriptionStart")}
                        min={new Date().toISOString().split("T")[0]}
                        className={getInputClassName("subscriptionStart")}
                      />
                      {touched.subscriptionStart && formErrors.subscriptionStart && (
                        <p className="text-xs text-red-500">{formErrors.subscriptionStart}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionEnd">
                        End Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subscriptionEnd"
                        type="date"
                        value={formData.subscriptionEnd}
                        onChange={(e) => handleInputChange("subscriptionEnd", e.target.value)}
                        onBlur={() => handleBlur("subscriptionEnd")}
                        min={formData.subscriptionStart || new Date().toISOString().split("T")[0]}
                        className={getInputClassName("subscriptionEnd")}
                      />
                      {touched.subscriptionEnd && formErrors.subscriptionEnd && (
                        <p className="text-xs text-red-500">{formErrors.subscriptionEnd}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Document Status
              </CardTitle>
              <CardDescription>Your uploaded documents will be shared with the property owner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification Status</span>
                <Badge variant={verifiedDocs === totalDocs ? "default" : "secondary"}>
                  {verifiedDocs}/{totalDocs} Verified
                </Badge>
              </div>
              {userDocuments.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No documents uploaded. Consider uploading documents to strengthen your application.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {userDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc.document_type}</span>
                        {doc.verified ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => window.open(doc.document_url, "_blank")}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Property:</span>
                <span className="font-medium">{property.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{property.transaction_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">{formatCurrency(property.price)}</span>
              </div>
              {formData.bidAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your {isSale ? "Offer" : "Bid"}:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(Number(formData.bidAmount))}</span>
                </div>
              )}
              {(formData.leaseStart || formData.subscriptionStart) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">
                    {formatDate(formData.leaseStart || formData.subscriptionStart)} -{" "}
                    {formatDate(formData.leaseEnd || formData.subscriptionEnd)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Application</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to submit your application for "{property.title}"? This will notify the property
                  owner and you cannot modify your application afterward.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Review Again</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>Submit Application</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
