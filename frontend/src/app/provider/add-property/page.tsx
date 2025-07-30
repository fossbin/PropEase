"use client"

import type React from "react"
import { supabase } from "@/lib/supabaseClient"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import LocationPicker from "@/components/LocationPicker"
import imageCompression from "browser-image-compression"
import Script from "next/script"
import {
  Home,
  MapPin,
  Camera,
  FileText,
  IndianRupee,
  Users,
  X,
  Upload,
  Loader2,
  CheckCircle,
  Sparkles,
  Brain,
  AlertTriangle,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

const userID = typeof window !== "undefined" ? sessionStorage.getItem("userId") || "" : ""

// Price recommendation response interface
interface PriceRecommendation {
  suggested_price: string
  price_range: string
  reasoning: string
  confidence_level: string
}

interface ValidationErrors {
  [key: string]: string
}

interface FormData {
  title: string
  description: string
  type: string
  transaction_type: string
  is_negotiable: boolean
  price: string
  capacity: string
  photos: string[]
  documents: { document_type: string; document_url: string; file_name: string }[]
  location: {
    address_line: string
    city: string
    state: string
    country: string
    zipcode: string
    latitude: string
    longitude: string
  }
}

export default function AddPropertyPage() {
  useAuthRedirect()
  const router = useRouter()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [loadingPriceRecommendation, setLoadingPriceRecommendation] = useState(false)
  const [priceRecommendation, setPriceRecommendation] = useState<PriceRecommendation | null>(null)
  const [showPriceRecommendation, setShowPriceRecommendation] = useState(false)

  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    type: "",
    transaction_type: "",
    is_negotiable: false,
    price: "",
    capacity: "",
    photos: [],
    documents: [],
    location: {
      address_line: "",
      city: "",
      state: "",
      country: "",
      zipcode: "",
      latitude: "",
      longitude: "",
    },
  })

  // Validation functions
  const validateField = (name: string, value: string | boolean | string[] | any[]): string => {
    switch (name) {
      case "title":
        if (typeof value !== "string") return ""
        if (!value.trim()) return "Property title is required"
        if (value.trim().length < 5) return "Title should be at least 5 characters"
        if (value.length > 100) return "Title cannot exceed 100 characters"
        if (!/^[a-zA-Z0-9\s,.-]+$/.test(value)) return "Title contains invalid characters"
        return ""

      case "description":
        if (typeof value !== "string") return ""
        if (!value.trim()) return "Description is required"
        if (value.trim().length < 20) return "Description should be at least 20 characters"
        if (value.length > 1000) return "Description cannot exceed 1000 characters"
        return ""

      case "type":
        if (typeof value !== "string") return ""
        if (!value.trim()) return "Property type is required"
        if (value.trim().length < 2) return "Property type should be at least 2 characters"
        if (value.length > 50) return "Property type cannot exceed 50 characters"
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Property type should only contain letters"
        return ""

      case "transaction_type":
        if (typeof value !== "string") return ""
        if (!value) return "Transaction type is required"
        if (!["Sale", "Lease", "PG"].includes(value)) return "Invalid transaction type"
        return ""

      case "price":
        if (typeof value !== "string") return ""
        if (!value.trim()) return "Price is required"
        if (!/^\d+(\.\d{1,2})?$/.test(value)) return "Price must be a valid number"
        const price = Number.parseFloat(value)
        if (price <= 0) return "Price must be greater than 0"
        if (price > 100000000) return "Price seems unreasonably high"
        if (formData.transaction_type === "PG" && price > 50000) return "PG price seems too high for monthly rent"
        if (formData.transaction_type === "Lease" && price > 200000)
          return "Lease price seems too high for monthly rent"
        return ""

      case "capacity":
        if (typeof value !== "string") return ""
        if (value && !/^\d+$/.test(value)) return "Capacity must be a whole number"
        if (value && Number.parseInt(value) <= 0) return "Capacity must be greater than 0"
        if (value && Number.parseInt(value) > 100) return "Capacity seems unreasonably high"
        return ""

      case "location.address_line":
        if (typeof value !== "string") return ""
        if (value && value.length > 200) return "Address line cannot exceed 200 characters"
        return ""

      case "location.city":
        if (typeof value !== "string") return ""
        if (value && !/^[a-zA-Z\s.-]+$/.test(value)) return "City name contains invalid characters"
        if (value && value.length > 50) return "City name cannot exceed 50 characters"
        return ""

      case "location.state":
        if (typeof value !== "string") return ""
        if (value && !/^[a-zA-Z\s.-]+$/.test(value)) return "State name contains invalid characters"
        if (value && value.length > 50) return "State name cannot exceed 50 characters"
        return ""

      case "location.country":
        if (typeof value !== "string") return ""
        if (value && !/^[a-zA-Z\s.-]+$/.test(value)) return "Country name contains invalid characters"
        if (value && value.length > 50) return "Country name cannot exceed 50 characters"
        return ""

      case "location.zipcode":
        if (typeof value !== "string") return ""
        if (value && !/^[a-zA-Z0-9\s-]+$/.test(value)) return "Invalid zip code format"
        if (value && value.length > 10) return "Zip code cannot exceed 10 characters"
        return ""

      case "location.coordinates":
        if (!formData.location.latitude || !formData.location.longitude) {
          return "Please select a location on the map"
        }
        const lat = Number.parseFloat(formData.location.latitude)
        const lng = Number.parseFloat(formData.location.longitude)
        if (isNaN(lat) || isNaN(lng)) return "Invalid coordinates"
        if (lat < -90 || lat > 90) return "Invalid latitude"
        if (lng < -180 || lng > 180) return "Invalid longitude"
        return ""

      case "photos":
        if (!Array.isArray(value)) return ""
        if (value.length === 0) return "At least one photo is required"
        return ""

      case "documents":
        if (!Array.isArray(value)) return ""
        if (value.length === 0) return "At least one document is required"
        return ""

      default:
        return ""
    }
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    // Validate all fields
    errors.title = validateField("title", formData.title)
    errors.description = validateField("description", formData.description)
    errors.type = validateField("type", formData.type)
    errors.transaction_type = validateField("transaction_type", formData.transaction_type)
    errors.price = validateField("price", formData.price)
    errors.capacity = validateField("capacity", formData.capacity)
    errors.photos = validateField("photos", formData.photos)
    errors.documents = validateField("documents", formData.documents)
    errors.coordinates = validateField("location.coordinates", "")

    // Validate location fields
    errors["location.address_line"] = validateField("location.address_line", formData.location.address_line)
    errors["location.city"] = validateField("location.city", formData.location.city)
    errors["location.state"] = validateField("location.state", formData.location.state)
    errors["location.country"] = validateField("location.country", formData.location.country)
    errors["location.zipcode"] = validateField("location.zipcode", formData.location.zipcode)

    // Remove empty errors
    Object.keys(errors).forEach((key) => {
      if (!errors[key]) delete errors[key]
    })

    setValidationErrors(errors)
    const isValid = Object.keys(errors).length === 0
    setIsFormValid(isValid)
    return isValid
  }

  const handleInputChange = (name: string, value: string | boolean) => {
    if (name.startsWith("location.")) {
      const key = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [key]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value)
      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }))
    }

    // Special handling for transaction type
    if (name === "transaction_type" && value === "PG") {
      setFormData((prev) => ({ ...prev, is_negotiable: false }))
    }
  }

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))

    let value: any
    if (name.startsWith("location.")) {
      const key = name.split(".")[1]
      value = formData.location[key as keyof typeof formData.location]
    } else {
      value = formData[name as keyof FormData]
    }

    const error = validateField(name, value)
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }

  const getInputClassName = (fieldName: string) => {
    const hasError = validationErrors[fieldName] && touched[fieldName]
    const isValid = touched[fieldName] && !validationErrors[fieldName]

    if (hasError) return "border-red-500 focus:border-red-500 focus:ring-red-500"
    if (isValid) return "border-green-500 focus:border-green-500 focus:ring-green-500"
    return ""
  }

  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = [
      formData.title,
      formData.description,
      formData.type,
      formData.transaction_type,
      formData.price,
      formData.location.latitude,
      formData.location.longitude,
      formData.photos.length > 0 ? "photos" : "",
      formData.documents.length > 0 ? "documents" : "",
    ]
    const filledFields = requiredFields.filter((field) => field && field.toString().trim() !== "").length
    return Math.round((filledFields / requiredFields.length) * 100)
  }

  // File validation
  const validateFile = (file: File, type: "image" | "document"): string => {
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (file.size > maxSize) {
      return "File size cannot exceed 10MB"
    }

    if (type === "image") {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        return "Only JPEG, PNG, and WebP images are allowed"
      }
    } else if (type === "document") {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!allowedTypes.includes(file.type)) {
        return "Only PDF, DOC, and DOCX files are allowed"
      }
    }

    return ""
  }

  // Get AI price recommendation
  const getPriceRecommendation = async () => {
    if (!formData.type || !formData.description || !formData.transaction_type) {
      setValidationErrors((prev) => ({
        ...prev,
        priceRecommendation:
          "Please fill in property type, description, and transaction type before getting price recommendation.",
      }))
      return
    }

    setLoadingPriceRecommendation(true)
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.priceRecommendation
      return newErrors
    })

    try {
      // Extract amenities from description (simple keyword matching)
      const amenitiesKeywords = [
        "parking",
        "gym",
        "swimming pool",
        "security",
        "elevator",
        "balcony",
        "garden",
        "wifi",
        "ac",
        "furnished",
        "kitchen",
        "bathroom",
      ]
      const amenities = amenitiesKeywords.filter((keyword) => formData.description.toLowerCase().includes(keyword))

      const requestBody = {
        property_type: formData.type,
        location: formData.location.address_line || `${formData.location.city}, ${formData.location.state}`,
        transaction_type: formData.transaction_type,
        description: formData.description,
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : null,
        amenities: amenities,
        city: formData.location.city,
        state: formData.location.state,
        country: formData.location.country,
        additional_info: `Title: ${formData.title}`,
      }

      const response = await fetch(`${API_BASE_URL}/api/pricing/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("UserId") || "",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to get price recommendation")
      }

      const recommendation: PriceRecommendation = await response.json()
      setPriceRecommendation(recommendation)
      setShowPriceRecommendation(true)

      // Auto-fill the price field with the suggested price (extract just the number)
      const priceMatch = recommendation.suggested_price.match(/[\d,]+/)
      if (priceMatch) {
        const suggestedPrice = priceMatch[0].replace(/,/g, "")
        handleInputChange("price", suggestedPrice)
      }
    } catch (error) {
      console.error("Price recommendation error:", error)
      setValidationErrors((prev) => ({
        ...prev,
        priceRecommendation: "Failed to get price recommendation. Please try again.",
      }))
    } finally {
      setLoadingPriceRecommendation(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Validate files first
    const fileErrors: string[] = []
    for (let i = 0; i < files.length; i++) {
      const error = validateFile(files[i], "image")
      if (error) fileErrors.push(`${files[i].name}: ${error}`)
    }

    if (fileErrors.length > 0) {
      setValidationErrors((prev) => ({
        ...prev,
        photoUpload: fileErrors.join(", "),
      }))
      return
    }

    setUploadingPhotos(true)
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.photoUpload
      return newErrors
    })

    const newPhotos: string[] = []
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    }

    for (let i = 0; i < Math.min(files.length, 2 - formData.photos.length); i++) {
      const file = files[i]
      try {
        const compressed = await imageCompression(file, options)
        const base64 = await imageCompression.getDataUrlFromFile(compressed)
        newPhotos.push(base64)
      } catch (err) {
        console.error("Image compression failed:", err)
        setValidationErrors((prev) => ({
          ...prev,
          photoUpload: `Failed to process ${file.name}`,
        }))
      }
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos].slice(0, 2),
    }))
    setUploadingPhotos(false)
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    handleInputChange(name, value)
  }

  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    handleInputChange(name, checked)
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !userID) return

    // Validate files first
    const fileErrors: string[] = []
    for (let i = 0; i < files.length; i++) {
      const error = validateFile(files[i], "document")
      if (error) fileErrors.push(`${files[i].name}: ${error}`)
    }

    if (fileErrors.length > 0) {
      setValidationErrors((prev) => ({
        ...prev,
        documentUpload: fileErrors.join(", "),
      }))
      return
    }

    setUploadingDocs(true)
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.documentUpload
      return newErrors
    })

    const newDocs: { document_type: string; document_url: string; file_name: string }[] = []

    for (let i = 0; i < Math.min(files.length, 2 - formData.documents.length); i++) {
      const file = files[i]
      const filePath = `property-files/${userID}/${Date.now()}-${file.name}`

      try {
        const { error } = await supabase.storage.from("property-files").upload(filePath, file)
        if (error) {
          console.error("File upload error:", error.message)
          setValidationErrors((prev) => ({
            ...prev,
            documentUpload: `Failed to upload ${file.name}: ${error.message}`,
          }))
          continue
        }

        const getDocumentType = (fileName: string): string => {
          const extension = fileName.split(".").pop()?.toLowerCase()
          switch (extension) {
            case "pdf":
              return "PDF"
            case "doc":
            case "docx":
              return "Document"
            default:
              return "Other"
          }
        }

        newDocs.push({
          document_type: getDocumentType(file.name),
          document_url: filePath,
          file_name: file.name,
        })
      } catch (error) {
        console.error("Upload error:", error)
        setValidationErrors((prev) => ({
          ...prev,
          documentUpload: `Failed to upload ${file.name}`,
        }))
      }
    }

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocs].slice(0, 2),
    }))
    setUploadingDocs(false)
  }

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  const sanitizeFormData = () => {
    return {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type.trim(),
      price: formData.price.trim(),
      capacity: formData.capacity.trim(),
      location: {
        ...formData.location,
        address_line: formData.location.address_line.trim(),
        city: formData.location.city.trim(),
        state: formData.location.state.trim(),
        country: formData.location.country.trim(),
        zipcode: formData.location.zipcode.trim(),
      },
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allFields = [
      "title",
      "description",
      "type",
      "transaction_type",
      "price",
      "capacity",
      "location.address_line",
      "location.city",
      "location.state",
      "location.country",
      "location.zipcode",
    ]
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}))

    if (!validateForm()) {
      setValidationErrors((prev) => ({
        ...prev,
        submit: "Please fix all errors before submitting the form",
      }))
      return
    }

    setIsSubmitting(true)
    setValidationErrors({})

    const sanitizedData = sanitizeFormData()
    const formattedPayload = {
      property: {
        title: sanitizedData.title,
        description: sanitizedData.description,
        type: sanitizedData.type,
        status: "Available",
        price: Number.parseFloat(sanitizedData.price),
        capacity: sanitizedData.capacity ? Number.parseInt(sanitizedData.capacity) : null,
        transaction_type: sanitizedData.transaction_type,
        is_negotiable: sanitizedData.is_negotiable,
        photos: sanitizedData.photos,
        documents: sanitizedData.documents,
      },
      location: {
        ...sanitizedData.location,
        latitude: Number.parseFloat(sanitizedData.location.latitude),
        longitude: Number.parseFloat(sanitizedData.location.longitude),
      },
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/properties/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userID,
        },
        body: JSON.stringify(formattedPayload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || `HTTP error! status: ${res.status}`)
      }

      router.push("/provider/my-properties")
    } catch (err) {
      console.error("Submission error:", err)
      setValidationErrors({
        submit: err instanceof Error ? err.message : "Failed to submit property. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Add New Property</h1>
          <p className="text-slate-600">Fill in the details to list your property</p>
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Form Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Global Error Alert */}
        {validationErrors.submit && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validationErrors.submit}</AlertDescription>
          </Alert>
        )}

        {validationErrors.priceRecommendation && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validationErrors.priceRecommendation}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
              <CardDescription>Provide the essential details about your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Property Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={() => handleBlur("title")}
                    required
                    placeholder="e.g., Modern 2BHK Apartment in Downtown"
                    className={`mt-1 ${getInputClassName("title")}`}
                    maxLength={100}
                  />
                  {touched.title && validationErrors.title && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.title}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{formData.title.length}/100 characters</p>
                </div>
                <div>
                  <Label htmlFor="type" className="text-sm font-medium">
                    Property Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    onBlur={() => handleBlur("type")}
                    required
                    placeholder="e.g., Apartment, House, Villa"
                    className={`mt-1 ${getInputClassName("type")}`}
                    maxLength={50}
                  />
                  {touched.type && validationErrors.type && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.type}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="transaction_type" className="text-sm font-medium">
                    Transaction Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleChange}
                    onBlur={() => handleBlur("transaction_type")}
                    required
                    className={`w-full mt-1 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getInputClassName("transaction_type")}`}
                  >
                    <option value="">Select Transaction Type</option>
                    <option value="Sale">Sale</option>
                    <option value="Lease">Lease</option>
                    <option value="PG">PG</option>
                  </select>
                  {touched.transaction_type && validationErrors.transaction_type && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.transaction_type}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={() => handleBlur("description")}
                  required
                  placeholder="Describe your property, its features, and amenities..."
                  className={`mt-1 min-h-[120px] ${getInputClassName("description")}`}
                  maxLength={1000}
                />
                {touched.description && validationErrors.description && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">{formData.description.length}/1000 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-green-600" />
                Pricing & Capacity
              </CardTitle>
              <CardDescription>Set your pricing and property capacity details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Price Recommendation Alert */}
              {showPriceRecommendation && priceRecommendation && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-900">AI Price Recommendation</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Suggested Price:</span> ₹{priceRecommendation.suggested_price}
                        </div>
                        <div>
                          <span className="font-medium">Price Range:</span> ₹{priceRecommendation.price_range}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Reasoning:</span> {priceRecommendation.reasoning}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Confidence:</span>
                        <span
                          className={`ml-1 px-2 py-1 rounded text-xs ${
                            priceRecommendation.confidence_level === "High"
                              ? "bg-green-100 text-green-800"
                              : priceRecommendation.confidence_level === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {priceRecommendation.confidence_level}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPriceRecommendation(false)}
                        className="mt-2"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Price <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getPriceRecommendation}
                      disabled={loadingPriceRecommendation || !formData.type || !formData.description}
                      className="text-xs px-3 py-1 h-auto bg-transparent"
                    >
                      {loadingPriceRecommendation ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Getting AI Price...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Get AI Price
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      onBlur={() => handleBlur("price")}
                      required
                      placeholder="0"
                      className={`pl-10 ${getInputClassName("price")}`}
                    />
                  </div>
                  {touched.price && validationErrors.price && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.price}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Fill property details above to get AI-powered price suggestion
                  </p>
                </div>
                <div>
                  <Label htmlFor="capacity" className="text-sm font-medium">
                    Capacity
                  </Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      onBlur={() => handleBlur("capacity")}
                      placeholder="Number of people"
                      className={`pl-10 ${getInputClassName("capacity")}`}
                    />
                  </div>
                  {touched.capacity && validationErrors.capacity && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.capacity}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_negotiable"
                  name="is_negotiable"
                  checked={formData.is_negotiable}
                  onChange={handleBooleanChange}
                  disabled={formData.transaction_type === "PG"}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <Label htmlFor="is_negotiable" className="text-sm font-medium">
                  Price is negotiable
                </Label>
                {formData.transaction_type === "PG" && (
                  <span className="text-xs text-red-500">(PG listings are not negotiable)</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Location Details
              </CardTitle>
              <CardDescription>Specify the exact location of your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`}
                strategy="beforeInteractive"
              />
              <div>
                <Label className="text-sm font-medium">
                  Pick Location (Click on Map) <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <LocationPicker
                    onLocationSelect={(loc) => {
                      setFormData((prev) => ({
                        ...prev,
                        location: {
                          address_line: loc.address_line,
                          city: loc.city,
                          state: loc.state,
                          country: loc.country,
                          zipcode: loc.zipcode,
                          latitude: loc.lat.toString(),
                          longitude: loc.lng.toString(),
                        },
                      }))
                      // Clear coordinate validation error when location is selected
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.coordinates
                        return newErrors
                      })
                    }}
                  />
                </div>
                {validationErrors.coordinates && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.coordinates}</p>
                )}
                {formData.location.latitude && formData.location.longitude && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Location selected</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="location.address_line" className="text-sm font-medium">
                    Address
                  </Label>
                  <Input
                    name="location.address_line"
                    value={formData.location.address_line}
                    onChange={handleChange}
                    onBlur={() => handleBlur("location.address_line")}
                    placeholder="Street address"
                    className={`mt-1 ${getInputClassName("location.address_line")}`}
                    maxLength={200}
                  />
                  {touched["location.address_line"] && validationErrors["location.address_line"] && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors["location.address_line"]}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location.city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    onBlur={() => handleBlur("location.city")}
                    placeholder="City"
                    className={`mt-1 ${getInputClassName("location.city")}`}
                    maxLength={50}
                  />
                  {touched["location.city"] && validationErrors["location.city"] && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors["location.city"]}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location.state" className="text-sm font-medium">
                    State
                  </Label>
                  <Input
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    onBlur={() => handleBlur("location.state")}
                    placeholder="State"
                    className={`mt-1 ${getInputClassName("location.state")}`}
                    maxLength={50}
                  />
                  {touched["location.state"] && validationErrors["location.state"] && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors["location.state"]}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location.country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Input
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    onBlur={() => handleBlur("location.country")}
                    placeholder="Country"
                    className={`mt-1 ${getInputClassName("location.country")}`}
                    maxLength={50}
                  />
                  {touched["location.country"] && validationErrors["location.country"] && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors["location.country"]}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location.zipcode" className="text-sm font-medium">
                    Zip Code
                  </Label>
                  <Input
                    name="location.zipcode"
                    value={formData.location.zipcode}
                    onChange={handleChange}
                    onBlur={() => handleBlur("location.zipcode")}
                    placeholder="Zip code"
                    className={`mt-1 ${getInputClassName("location.zipcode")}`}
                    maxLength={10}
                  />
                  {touched["location.zipcode"] && validationErrors["location.zipcode"] && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors["location.zipcode"]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-600" />
                Photos & Documents
              </CardTitle>
              <CardDescription>Upload photos and relevant documents for your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Property Photos (Max 2) <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={uploadingPhotos || formData.photos.length >= 2}
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      {uploadingPhotos ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Compressing images...</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Click to upload photos or drag and drop</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP up to 10MB each</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                {validationErrors.photoUpload && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.photoUpload}</p>
                )}
                {validationErrors.photos && <p className="text-xs text-red-500 mt-1">{validationErrors.photos}</p>}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.photos.map((src, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={src || "/placeholder.svg"}
                          alt={`Property photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Documents (Max 2) <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="doc-upload"
                      disabled={uploadingDocs || formData.documents.length >= 2}
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer">
                      {uploadingDocs ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Uploading documents...</span>
                        </div>
                      ) : (
                        <div>
                          <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Click to upload documents</p>
                          <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX up to 10MB each</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                {validationErrors.documentUpload && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.documentUpload}</p>
                )}
                {validationErrors.documents && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.documents}</p>
                )}
                {formData.documents.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{doc.file_name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid || progress < 100}
              className="px-8 py-3 text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </div>
              ) : (
                "Submit Property"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
