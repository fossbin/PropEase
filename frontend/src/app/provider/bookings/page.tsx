"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar, DollarSign, MapPin } from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

type LeaseTransaction = {
  id: string
  property_id: string
  rent: string
  start_date: string
  end_date: string
  last_paid_month: string
  payment_status: string
  terminated_at?: string
  transaction_type: "Lease"
  user: {
    id: string
    name: string
    email: string
    phone_number?: string
  }
}

type SubscriptionTransaction = {
  id: string
  property_id: string
  rent: string
  start_date: string
  end_date: string
  last_paid_period: string
  payment_status: string
  is_active?: boolean
  terminated_at?: string
  transaction_type: "PG"
  user: {
    id: string
    name: string
    email: string
    phone_number?: string
  }
}

type SaleTransaction = {
  id: string
  property_id: string
  sale_price: string
  sale_date: string
  transaction_type: "Sale"
  user: {
    id: string
    name: string
    email: string
    phone_number?: string
  }
}

type Transaction = LeaseTransaction | SubscriptionTransaction | SaleTransaction

interface TransactionGroup {
  property: {
    id: string
    title: string
    type: string
    transaction_type: string
    status: string
  }
  transactions: Transaction[]
}

export default function ProviderTransactionsPage() {
  useAuthRedirect()
  const [data, setData] = useState<TransactionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/provider/transactions`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const result = await res.json()
        if (Array.isArray(result)) {
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
        <p className="text-muted-foreground">No transactions found for your properties.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Property Bookings</h2>
        <Badge variant="secondary" className="text-sm">
          {data.reduce((acc, group) => acc + group.transactions.length, 0)} total bookings
        </Badge>
      </div>

      <div className="grid gap-6">
        {data.map((group) => (
          <Card key={group.property.id} className="overflow-hidden">
            <div className="bg-muted/50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{group.property.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {group.property.type}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="font-medium">
                  {group.property.transaction_type}
                </Badge>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="divide-y">
                {group.transactions.map((txn) => {
                  const isTerminated = Boolean((txn as any).terminated_at)

                  return (
                    <Link
                      key={txn.id}
                      href={`bookings/${txn.id}`}
                      className="block hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {/* User icon placeholder */}
                            </div>
                            <div>
                              <p className="font-semibold">{txn.user?.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{txn.user?.email || "No email"}</p>
                            </div>
                          </div>
                          {isTerminated && <Badge variant="destructive">Terminated</Badge>}
                        </div>

                        {txn.transaction_type === "Sale" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Sale Price:</span>
                              <span className="font-semibold">₹{txn.sale_price}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Sale Date:</span>
                              <span>{format(new Date(txn.sale_date), "dd MMM yyyy")}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Rent:</span>
                                <span className="font-semibold">₹{txn.rent}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Duration:</span>
                                <span>
                                  {format(new Date(txn.start_date), "MMM yyyy")} –{" "}
                                  {format(new Date(txn.end_date), "MMM yyyy")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Last Paid:</span>
                                <span>
                                  {format(
                                    new Date(
                                      txn.transaction_type === "Lease" ? txn.last_paid_month : txn.last_paid_period,
                                    ),
                                    "MMM yyyy",
                                  )}
                                </span>
                              </div>
                              <Badge className={`${getStatusColor(txn.payment_status)} border`} variant="outline">
                                {txn.payment_status}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
