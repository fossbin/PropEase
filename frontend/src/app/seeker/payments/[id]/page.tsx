"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  CalendarCheck,
  Info,
  Download,
  CreditCard,
  Home,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface PaymentDetail {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
  property: {
    title: string
    transaction_type: string
  }
  lease_period?: {
    start_date: string
    end_date: string
  }
}

export default function PaymentDetailPage() {
  useAuthRedirect()
  const { id } = useParams()
  const router = useRouter()
  const [detail, setDetail] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/${id}`)
        if (!res.ok) throw new Error("Failed to fetch payment detail")
        const data = await res.json()
        setDetail(data)
      } catch (err) {
        console.error(err)
        setError("Failed to load payment details")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchDetail()
  }, [id])

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "lease":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pg":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "sale":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDownloadReceipt = () => {
    // Placeholder for receipt download functionality
    alert("Receipt download functionality would be implemented here")
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Payment not found</h3>
          <p className="text-muted-foreground mb-4">{error || "The payment you're looking for doesn't exist."}</p>
          <Button onClick={() => router.push("/payments")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
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
          <h1 className="text-2xl font-bold">Payment Receipt</h1>
          <p className="text-muted-foreground">Payment ID: {detail.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
          <Button onClick={handleDownloadReceipt} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <div className="text-4xl font-bold text-green-600 mb-2">₹{detail.amount.toLocaleString()}</div>
                <p className="text-muted-foreground">Payment Amount</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{detail.description}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Type</p>
                  <p className="font-medium">{detail.type}</p>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Paid on</span>
                  <span className="font-medium">{format(new Date(detail.created_at), "PPP")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Period */}
          {detail.lease_period && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lease Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(detail.lease_period.start_date), "PPP")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{format(new Date(detail.lease_period.end_date), "PPP")}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {Math.ceil(
                      (new Date(detail.lease_period.end_date).getTime() -
                        new Date(detail.lease_period.start_date).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{detail.property.title}</p>
                <Badge
                  className={`${getTransactionTypeColor(detail.property.transaction_type)} border mt-2`}
                  variant="outline"
                >
                  {detail.property.transaction_type}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Payment Successful</p>
                  <p className="text-sm text-muted-foreground">Transaction completed</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono">{detail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{format(new Date(detail.created_at), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Time:</span>
                  <span>{format(new Date(detail.created_at), "HH:mm:ss")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleDownloadReceipt} className="w-full bg-transparent" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
              <Button onClick={() => router.push("/payments")} className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View All Payments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This is an electronic receipt. For any queries regarding this payment, please contact our support team.
          </p>
          <p className="text-xs text-muted-foreground mt-2">Generated on {format(new Date(), "PPP 'at' p")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
