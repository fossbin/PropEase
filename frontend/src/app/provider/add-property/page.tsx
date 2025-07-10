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
import LocationPicker from "@/components/LocationPicker"
import imageCompression from "browser-image-compression"
import Script from "next/script"
import { Home, MapPin, Camera, FileText, IndianRupee, Users, X, Upload, Loader2, CheckCircle } from "lucide-react"

const userID = typeof window !== "undefined" ? sessionStorage.getItem("userId") || "" : ""

export default function AddPropertyPage() {
  const router = useRouter()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    transaction_type: "",
    is_negotiable: false,
    price: "",
    capacity: "",
    photos: [] as string[],
    documents: [] as { name: string; path: string }[],
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
      formData.photos.length > 0 ? formData.photos[0] : "", 
      formData.documents.length > 0 ? formData.documents[0].path : "",
    ]
    const filledFields = requiredFields.filter((field) => field && field.toString().trim() !== "").length
    return Math.round((filledFields / requiredFields.length) * 100)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploadingPhotos(true)
    const newPhotos: string[] = []
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    }

    for (let i = 0; i < Math.min(files.length, 2); i++) {
      const file = files[i]
      try {
        const compressed = await imageCompression(file, options)
        const base64 = await imageCompression.getDataUrlFromFile(compressed)
        newPhotos.push(base64)
      } catch (err) {
        console.error("Image compression failed:", err)
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
    const { name, value } = e.target;
    if (name === "transaction_type" && value === "PG") {
      setFormData((prev) => ({ ...prev, transaction_type: value, is_negotiable: false }));
      return;
    }

    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !userID) return

    setUploadingDocs(true)
    const newDocs: { name: string; path: string }[] = []

    for (let i = 0; i < Math.min(files.length, 2); i++) {
      const file = files[i]
      const filePath = `property-files/${userID}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("property-files").upload(filePath, file)

      if (error) {
        console.error("File upload error:", error.message)
        continue
      }

      newDocs.push({ name: file.name, path: filePath })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formattedPayload = {
      property: {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: "Available",
        price: Number.parseFloat(formData.price),
        capacity: Number.parseInt(formData.capacity),
        transaction_type: formData.transaction_type,
        is_negotiable: formData.is_negotiable,
        photos: formData.photos,
        documents: formData.documents,
      },
      location: {
        ...formData.location,
        latitude: Number.parseFloat(formData.location.latitude),
        longitude: Number.parseFloat(formData.location.longitude),
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

      if (res.ok) {
        router.push("/provider/my-properties")
      } else {
        const error = await res.json()
        console.error("Error:", error)
      }
    } catch (err) {
      console.error("Submission error:", err)
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
                    Property Title *
                  </Label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Modern 2BHK Apartment in Downtown"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm font-medium">
                    Property Type *
                  </Label>
                  <Input
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Apartment, House, Villa"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="transaction_type" className="text-sm font-medium">
                    Transaction Type *
                  </Label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleChange}
                    required
                    className="w-full mt-1 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Transaction Type</option>
                    <option value="sale">Sale</option>
                    <option value="lease">Lease</option>
                    <option value="pg">PG</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe your property, its features, and amenities..."
                  className="mt-1 min-h-[120px]"
                />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price *
                  </Label>
                  <div className="relative mt-1">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity" className="text-sm font-medium">
                    Capacity
                  </Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      placeholder="Number of people"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_negotiable"
                  name="is_negotiable"
                  checked={formData.is_negotiable}
                  onChange={handleBooleanChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                <Label className="text-sm font-medium">Pick Location (Click on Map) *</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <LocationPicker
                    onLocationSelect={(loc) =>
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
                    }
                  />
                </div>
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
                    placeholder="Street address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location.city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location.state" className="text-sm font-medium">
                    State
                  </Label>
                  <Input
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location.country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Input
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location.zipcode" className="text-sm font-medium">
                    Zip Code
                  </Label>
                  <Input
                    name="location.zipcode"
                    value={formData.location.zipcode}
                    onChange={handleChange}
                    placeholder="Zip code"
                    className="mt-1"
                  />
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
                <Label className="text-sm font-medium">Property Photos (Max 2)</Label>
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
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB each</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

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
                <Label className="text-sm font-medium">Documents (Max 2)</Label>
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

                {formData.documents.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-700">{doc.name}</span>
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
            <Button type="submit" disabled={isSubmitting || progress < 100} className="px-8 py-3 text-lg">
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
