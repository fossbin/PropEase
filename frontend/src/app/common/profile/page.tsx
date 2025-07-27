"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import imageCompression from "browser-image-compression"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import {
  User,
  Phone,
  Mail,
  Upload,
  FileText,
  LogOut,
  Camera,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Profile {
  name: string
  email: string
  phone_number: string
  picture?: any
}

export default function UserProfilePage() {
  useAuthRedirect()
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone_number: "",
    picture: null,
  })
  const [document, setDocument] = useState<File | null>(null)
  const [existingDocument, setExistingDocument] = useState<{
    document_url: string
    document_type: string
    verified: boolean
  } | null>(null)  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const router = useRouter()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    if (!userId) return

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            "X-User-Id": userId,
          },
        })
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`)
        const data = await res.json()
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          picture: data.picture || null,
        })

        if (data.picture?.base64) {
          setImagePreview(data.picture.base64)
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        setUploadStatus("error")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
    fetchDocuments(userId)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (file: File) => {
    if (!file) return

    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      }

      const compressedFile = await imageCompression(file, options)
      const base64 = await imageCompression.getDataUrlFromFile(compressedFile)

      setImagePreview(base64)
      setProfile((prev) => ({
        ...prev,
        picture: {
          name: file.name,
          type: file.type,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          base64,
        },
      }))
    } catch (err) {
      console.error("Image compression error:", err)
      setUploadStatus("error")
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageChange(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0])
    }
  }

  const fetchDocuments = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${userId}/documents`)
      if (!res.ok) throw new Error("Failed to fetch documents")
      const data = await res.json()
      if (data.length > 0) setExistingDocument(data[0]) // Only keep one
    } catch (err) {
      console.error("Error loading document:", err)
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setDocument(file)
  }

  const removeProfilePicture = () => {
    setImagePreview(null)
    setProfile((prev) => ({ ...prev, picture: null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setUploadStatus("idle")

    const userId = sessionStorage.getItem("userId")
    if (!userId) return

    try {
      if (document) {
        const formData = new FormData()
        formData.append("file", document)
        formData.append("filename", document.name)
        formData.append("user_id", userId)

        const docUploadRes = await fetch(`${API_BASE_URL}/api/user/upload-document`, {
          method: "POST",
          body: formData,
        })

        if (!docUploadRes.ok) {
          throw new Error(`Failed to upload document: ${document.name}`)
        }
      }
    } catch (err) {
      console.error("Update error:", err)
      setUploadStatus("error")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userRole")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="self-start sm:self-center bg-transparent">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Status Alert */}
      {uploadStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to update profile. Please try again.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>Upload a profile picture. Images will be compressed automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback className="text-lg">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop an image here, or click to select</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="profile-picture"
                  />
                  <Label htmlFor="profile-picture" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm">
                      Choose File
                    </Button>
                  </Label>
                </div>

                {imagePreview && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeProfilePicture}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">Email address cannot be changed from this page</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>Upload important documents (PDF, JPG, PNG formats supported).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="documents">Upload Documents</Label>
              <Input
                id="documents"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleDocumentChange}
                className="mt-2"
              />
            </div>

              {document && (
                <div className="space-y-2">
                  <Label>Selected Document:</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{document.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(document.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocument(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {existingDocument && (
                <div className="space-y-2">
                  <Label>Uploaded Document:</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <a href={existingDocument.document_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                        {existingDocument.document_url.split("/").pop()}
                      </a>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {existingDocument.document_type.split("/")[1]}
                      </Badge>
                      {existingDocument.verified && (
                        <Badge  className="text-xs ml-2 bg-green-100 text-green-700">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-32">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
