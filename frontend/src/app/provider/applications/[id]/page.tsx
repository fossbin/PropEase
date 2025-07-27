"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Download,
  FileText,
  Home,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  ShieldCheck,
  User,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Document {
  id: string
  document_url: string
  document_type: string
  verified: boolean
}

interface PropertyDetails {
  title: string
  type: string
  price: number
  status: string
  is_negotiable: boolean
  transaction_type: string
}

interface Application {
  id: string
  status: string
  message?: string
  bid_amount?: number
  lease_start?: string
  lease_end?: string
  subscription_start?: string
  subscription_end?: string
  property_id: string
  property_title: string
  applicant_id: string
  applicant_name: string
  created_at: string
}

interface UserProfile {
  name: string
  phone_number: string
  email: string
}

export default function ApplicationDetailPage() {
  useAuthRedirect()
  const { id } = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<Application | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userDocuments, setUserDocuments] = useState<Document[]>([])
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
          headers: { "X-User-Id": sessionStorage.getItem("userId") || "" },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch application details")
        }

        const data = await res.json()
        setApplication(data.application)
        setUserProfile(data.user_profile)
        setUserDocuments(data.user_documents)
        setPropertyDetails(data.property_details)
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load application details")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchApplication()
  }, [id])

  const handleUpdate = async (status: "Approved" | "Rejected") => {
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        throw new Error("Failed to update application")
      }

      setApplication((prev) => (prev ? { ...prev, status } : prev))
    } catch (err) {
      console.error("Failed to update application:", err)
      alert("Error updating application")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <Check className="h-4 w-4" />
      case "rejected":
        return <X className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading application details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Application not found</h3>
          <p className="text-muted-foreground mb-4">{error || "The application you're looking for doesn't exist."}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Application Details</h1>
          <p className="text-muted-foreground">Application for {application.property_title}</p>
        </div>
        <Badge className={`${getStatusColor(application.status)} border flex items-center gap-1`} variant="outline">
          {getStatusIcon(application.status)}
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          {propertyDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Property Type</p>
                      <p className="font-medium">{propertyDetails.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Type</p>
                      <p className="font-medium">{propertyDetails.transaction_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant="outline">{propertyDetails.status}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Listed Price</p>
                      <p className="text-xl font-semibold">₹{propertyDetails.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Negotiable</p>
                      <Badge variant={propertyDetails.is_negotiable ? "secondary" : "outline"}>
                        {propertyDetails.is_negotiable ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message */}
              {application.message && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Applicant Message
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{application.message}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Bid Amount */}
                {typeof application.bid_amount === "number" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Bid Amount
                    </div>
                    <p className="text-xl font-semibold">₹{application.bid_amount.toLocaleString()}</p>
                    {propertyDetails && application.bid_amount !== propertyDetails.price && (
                      <p className="text-sm text-muted-foreground">
                        {application.bid_amount > propertyDetails.price ? "+" : ""}
                        {(((application.bid_amount - propertyDetails.price) / propertyDetails.price) * 100).toFixed(1)}%
                        from listed price
                      </p>
                    )}
                  </div>
                )}

                {/* Application Date */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Application Date
                  </div>
                  <p className="font-medium">{format(new Date(application.created_at), "dd MMM yyyy")}</p>
                </div>
              </div>

              {/* Lease Duration */}
              {application.lease_start && application.lease_end && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Requested Lease Duration
                  </div>
                  <p className="font-medium">
                    {format(new Date(application.lease_start), "dd MMM yyyy")} -{" "}
                    {format(new Date(application.lease_end), "dd MMM yyyy")}
                  </p>
                </div>
              )}

              {/* Subscription Period */}
              {application.subscription_start && application.subscription_end && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Requested Subscription Period
                  </div>
                  <p className="font-medium">
                    {format(new Date(application.subscription_start), "dd MMM yyyy")} -{" "}
                    {format(new Date(application.subscription_end), "dd MMM yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {userDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <div className="flex items-center gap-2">
                            {doc.verified ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <ShieldCheck className="h-3 w-3" />
                                <span className="text-xs">Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <Shield className="h-3 w-3" />
                                <span className="text-xs">Unverified</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{application.applicant_name}</p>
                  <p className="text-sm text-muted-foreground">Applicant</p>
                </div>
              </div>

              {userProfile && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.email}</span>
                    </div>
                    {userProfile.phone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{userProfile.phone_number}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {application.status === "Pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => handleUpdate("Approved")} disabled={updating} className="w-full" size="sm">
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve Application
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdate("Rejected")}
                  disabled={updating}
                  className="w-full"
                  size="sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject Application
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status Info */}
          {application.status !== "Pending" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}
                  >
                    {getStatusIcon(application.status)}
                    Application {application.status}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This application has been {application.status.toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
