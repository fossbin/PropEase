"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Home, MapPin, DollarSign, Users, AlertCircle } from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

const propertyTypes = ["Apartment", "PG", "Land", "Villa"]
const transactionTypes = ["Sale", "Lease", "PG"]
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function EditPropertyPage() {
  useAuthRedirect()
  const router = useRouter()
  const { id } = useParams()
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") || "" : ""

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    transaction_type: "",
    price: "",
    capacity: "",
    is_negotiable: false,
  })

  const [locationData, setLocationData] = useState({
    address_line: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    latitude: "",
    longitude: "",
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
          headers: {
            "X-User-Id": userId,
          },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.detail || "Failed to fetch property")
        }
        setFormData({
          title: data.title || "",
          description: data.description || "",
          type: data.type || "",
          transaction_type: data.transaction_type || "",
          price: data.price?.toString() || "",
          capacity: data.capacity?.toString() || "",
          is_negotiable: data.is_negotiable || false,
        })
        setLocationData({
          address_line: data.location?.address_line || "",
          city: data.location?.city || "",
          state: data.location?.state || "",
          country: data.location?.country || "",
          zipcode: data.location?.zipcode || "",
          latitude: data.location?.latitude?.toString() || "",
          longitude: data.location?.longitude?.toString() || "",
        })
      } catch (error) {
        console.error("Error fetching property:", error)
        setError("Failed to load property details")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProperty()
  }, [id, userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    const newValue = type === "checkbox" ? checked : value

    if (name in locationData) {
      setLocationData((prev) => ({ ...prev, [name]: newValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: newValue }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_negotiable: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const updatedPayload = {
      property: {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        transaction_type: formData.transaction_type,
        price: Number.parseFloat(formData.price),
        capacity: Number.parseInt(formData.capacity) || 0,
        is_negotiable: formData.is_negotiable,
      },
      location: {
        address_line: locationData.address_line,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        zipcode: locationData.zipcode,
        latitude: Number.parseFloat(locationData.latitude) || 0,
        longitude: Number.parseFloat(locationData.longitude) || 0,
      },
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify(updatedPayload),
      })

      if (res.ok) {
        router.push("/provider/my-properties")
      } else {
        const error = await res.json()
        setError(error.detail || "Failed to update property")
      }
    } catch (err) {
      console.error("Submission error:", err)
      setError("An error occurred while updating the property")
    } finally {
      setSubmitting(false)
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

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Property</h1>
          <p className="text-muted-foreground">Update your property information</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter property title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Property Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transaction_type">Transaction Type *</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) => handleSelectChange("transaction_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property..."
                  rows={4}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  required
                />
              </div>

              <div>
                <Label htmlFor="capacity">
                  <Users className="inline h-4 w-4 mr-1" />
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Number of people"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="is_negotiable" checked={formData.is_negotiable} onCheckedChange={handleCheckboxChange} />
              <Label
                htmlFor="is_negotiable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Price is negotiable
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_line">Address Line *</Label>
              <Input
                id="address_line"
                name="address_line"
                value={locationData.address_line}
                onChange={handleChange}
                placeholder="Enter full address"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={locationData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={locationData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={locationData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                />
              </div>

              <div>
                <Label htmlFor="zipcode">Zipcode</Label>
                <Input
                  id="zipcode"
                  name="zipcode"
                  value={locationData.zipcode}
                  onChange={handleChange}
                  placeholder="Enter zipcode"
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={locationData.latitude}
                  onChange={handleChange}
                  placeholder="Enter latitude"
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={locationData.longitude}
                  onChange={handleChange}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              "Update Property"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
