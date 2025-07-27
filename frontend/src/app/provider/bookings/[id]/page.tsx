"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  Phone,
  User,
  Home,
  AlertTriangle,
  Download,
  Clock,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface TransactionDetail {
  id: string
  transaction_type: "Lease" | "PG" | "Sale"
  property?: {
    id: string
    title: string
    type: string
    transaction_type: string
  }
  user: {
    id: string
    name: string
    email: string
    phone_number?: string
  }
  rent?: string
  sale_price?: string
  start_date?: string
  end_date?: string
  last_paid_month?: string
  last_paid_period?: string
  payment_status?: string
  late_fee?: string
  deed_file?: string
  agreement_file?: string
  terminated_at?: string
  terminated_by?: string
  created_at: string
}

export default function TransactionDetailPage() {
  useAuthRedirect()
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [terminating, setTerminating] = useState(false)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/transactions/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error("Error loading transaction detail:", err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetail()
  }, [id])

  const handleTerminate = async () => {
    if (!confirm("Are you sure you want to terminate this agreement?")) return

    setTerminating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/provider/transactions/${id}/terminate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (res.ok) {
        alert("Agreement terminated")
        window.location.reload()
      } else {
        throw new Error(await res.text())
      }
    } catch (err) {
      console.error("Termination failed:", err)
      alert("Failed to terminate agreement.")
    } finally {
      setTerminating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "overdue":
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
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Booking not found</h3>
          <p className="text-muted-foreground mb-4">The booking you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { transaction_type, property, user } = data

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">Transaction ID: {data.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Property Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{property?.title || "Untitled Property"}</h3>
              <p className="text-muted-foreground">{property?.type || "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium">
                {transaction_type.charAt(0).toUpperCase() + transaction_type.slice(1)}
              </Badge>
              {data.terminated_at && <Badge variant="destructive">Terminated</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Tenant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">Tenant</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phone_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone_number}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transaction_type === "Sale" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sale Price:</span>
                  <span className="font-semibold text-lg">₹{data.sale_price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sale Date:</span>
                  <span>{format(new Date(data.created_at), "dd MMM yyyy")}</span>
                </div>
              </div>
              {data.deed_file && (
                <div className="flex items-center justify-end">
                  <Button asChild variant="outline">
                    <a href={data.deed_file} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Sale Deed
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Monthly Rent
                  </div>
                  <p className="text-xl font-semibold">₹{data.rent || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </div>
                  <p className="font-medium">
                    {data.start_date ? format(new Date(data.start_date), "dd MMM yyyy") : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </div>
                  <p className="font-medium">
                    {data.end_date ? format(new Date(data.end_date), "dd MMM yyyy") : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Payment Status
                  </div>
                  {data.payment_status && (
                    <Badge className={`${getStatusColor(data.payment_status)} border w-fit`} variant="outline">
                      {data.payment_status}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Payment</p>
                    <p className="font-medium">
                      {data.last_paid_month || data.last_paid_period
                        ? format(new Date(data.last_paid_month || data.last_paid_period!), "MMM yyyy")
                        : "N/A"}
                    </p>
                  </div>
                  {data.late_fee && (
                    <div>
                      <p className="text-sm text-muted-foreground">Late Fee</p>
                      <p className="font-medium text-red-600">₹{data.late_fee}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {data.agreement_file && (
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <a href={data.agreement_file} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Agreement
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {data.terminated_at && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Agreement Terminated</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Terminated on {format(new Date(data.terminated_at), "dd MMM yyyy")} by {data.terminated_by}
                  </p>
                </div>
              )}

              {!data.terminated_at && (
                <div className="flex justify-end pt-4 border-t">
                  <Button variant="destructive" onClick={handleTerminate} disabled={terminating}>
                    {terminating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Terminating...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Terminate Agreement
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
