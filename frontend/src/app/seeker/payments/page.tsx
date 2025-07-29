"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  Loader2,
  Clock,
  CheckCircle,
  CreditCard,
  Calendar,
  Home,
  Search,
  Filter,
  Receipt,
  AlertCircle,
  TrendingUp,
  Repeat,
} from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Payment {
  id?: string
  amount: number
  type: string
  description: string
  created_at: string
  property: {
    id: string
    title: string
    transaction_type: string
  }
  sale_id?: string
  lease_id?: string
  subscription_id?: string
  status: "Paid" | "Pending Payment"
  recurring?: boolean
}

export default function PaymentsPage() {
  useAuthRedirect()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchPayments = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("User not authenticated")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/payments`, {
          method: "GET",
          headers: {
            "X-User-Id": sessionStorage.getItem("userId") || "",
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error("Failed to fetch payments")
        const data: Payment[] = await res.json()
        setPayments(data)
      } catch (error) {
        console.error("Error loading payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const handlePayment = async (payment: Payment) => {
    const id = payment.sale_id || payment.lease_id || payment.subscription_id
    const endpoint = payment.sale_id ? "sale" : payment.lease_id ? "lease" : "subscription"

    if (!id) return

    setProcessing(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/pay/${endpoint}/${id}`, {
        method: "POST",
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) throw new Error("Payment failed")

      // Refetch payments
      const refreshed = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "GET",
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
      })
      const newData: Payment[] = await refreshed.json()
      setPayments(newData)
    } catch (err) {
      console.error("Payment error:", err)
      alert("Payment failed. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending Payment":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-3 w-3" />
      case "Pending Payment":
        return <Clock className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

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

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status.toLowerCase().includes(statusFilter.toLowerCase())

    const matchesType =
      typeFilter === "all" || payment.property.transaction_type.toLowerCase() === typeFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesType
  })

  const totalPayments = payments.length
  const paidPayments = payments.filter((p) => p.status === "Paid").length
  const pendingPayments = payments.filter((p) => p.status === "Pending Payment").length
  const totalAmount = payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments.filter((p) => p.status === "Pending Payment").reduce((sum, p) => sum + p.amount, 0)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
            <p className="text-muted-foreground">Track your property payments and transactions</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {totalPayments} total payments
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">All time payments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">₹{totalAmount.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">₹{pendingAmount.toLocaleString()} due</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property, description, or payment type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="pg">PG</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {payments.length === 0 ? "No payments found" : "No payments match your search"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {payments.length === 0
                ? "Your payment history and pending payments will appear here."
                : "Try adjusting your search terms or filters to find what you're looking for."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment, index) => {
            const paymentId = payment.sale_id || payment.lease_id || payment.subscription_id
            const isProcessing = processing === paymentId

            return (
              <Card
                key={index}
                className={`overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
                  payment.status === "Pending Payment"
                    ? "border-l-4 border-l-yellow-500"
                    : "border-l-4 border-l-green-500"
                }`}
                onClick={() => {
                  if (payment.status === "Paid" && payment.id) {
                    router.push(`/payments/${payment.id}`)
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">₹{payment.amount.toLocaleString()}</h3>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getStatusColor(payment.status)} border text-xs`} variant="outline">
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{payment.status}</span>
                        </Badge>
                        <Badge
                          className={`${getTransactionTypeColor(payment.property.transaction_type)} border text-xs`}
                          variant="outline"
                        >
                          <Home className="h-3 w-3 mr-1" />
                          {payment.property.transaction_type}
                        </Badge>
                        {payment.recurring && (
                          <Badge variant="outline" className="text-xs">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">{payment.property.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(payment.created_at), "PPP")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-4">
                      {payment.status === "Pending Payment" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePayment(payment)
                          }}
                          disabled={isProcessing}
                          className="min-w-[100px]"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </>
                          )}
                        </Button>
                      )}

                      {payment.status === "Paid" && payment.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/payments/${payment.id}`)
                          }}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
