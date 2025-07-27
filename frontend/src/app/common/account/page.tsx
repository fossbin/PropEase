"use client"

import { useActionState, useEffect, useState } from "react"
import useAuthRedirect from "@/hooks/useAuthRedirect"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  CreditCard,
  Building,
  Calendar,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertTriangle,
  History,
  PiggyBank,
} from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  property_title?: string
  created_at: string
}

export default function AccountPage() {
  useAuthRedirect()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState<string>("")
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    if (!userId) return

    const fetchData = async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/common/account/balance`, {
            headers: { "X-User-Id": userId },
          }),
          fetch(`${API_BASE_URL}/api/common/account/transactions`, {
            headers: { "X-User-Id": userId },
          }),
        ])

        const balanceData = await balanceRes.json()
        if (balanceData?.balance !== undefined) {
          setBalance(balanceData.balance)
        }

        const txData = await transactionsRes.json()
        setTransactions(Array.isArray(txData) ? txData : [])
      } catch (error) {
        console.error("Error fetching account data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [API_BASE_URL])

  const handleTransaction = async () => {
    const userId = sessionStorage.getItem("userId")
    const numAmount = Number.parseFloat(amount)

    if (!userId || numAmount <= 0 || isNaN(numAmount)) {
      setSubmitStatus("error")
      return
    }

    setSubmitting(true)
    setSubmitStatus("idle")

    try {
      const endpoint = `${API_BASE_URL}/api/common/account/${action}`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({ amount: numAmount }),
      })

      const result = await res.json()

      if (res.ok) {
        setSubmitStatus("success")
        setAmount("")
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Transaction error:", error)
      setSubmitStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdraw":
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "payment":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "payout":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "deposit":
      case "payout":
        return "text-green-600"
      case "withdraw":
      case "withdrawal":
      case "payment":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || tx.type.toLowerCase() === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  const totalIncome = transactions
    .filter((tx) => ["deposit", "payout"].includes(tx.type.toLowerCase()))
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpenses = transactions
    .filter((tx) => ["withdraw", "withdrawal", "payment"].includes(tx.type.toLowerCase()))
    .reduce((sum, tx) => sum + tx.amount, 0)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading account data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground">Manage your balance and view transaction history</p>
        </div>
      </div>

      {/* Status Alert */}
      {submitStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Transaction completed successfully! Your balance will be updated shortly.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Transaction failed. Please check your input and try again.</AlertDescription>
        </Alert>
      )}

      {/* Balance and Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Balance */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">Deposits & payouts</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Withdrawals & payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Make Transaction
          </CardTitle>
          <CardDescription>Add or withdraw funds from your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={action === "deposit" ? "default" : "outline"}
                  onClick={() => setAction("deposit")}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Deposit
                </Button>
                <Button
                  type="button"
                  variant={action === "withdraw" ? "default" : "outline"}
                  onClick={() => setAction("withdraw")}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleTransaction} disabled={submitting || !amount} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action === "deposit" ? (
                      <ArrowDownLeft className="h-4 w-4 mr-2" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                    )}
                    {action === "deposit" ? "Add Funds" : "Withdraw Funds"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {amount && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Transaction Summary:</strong> {action === "deposit" ? "Add" : "Withdraw"}{" "}
                {formatCurrency(Number.parseFloat(amount) || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                New balance will be:{" "}
                {formatCurrency(balance + (action === "deposit" ? 1 : -1) * (Number.parseFloat(amount) || 0))}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>View all your account transactions</CardDescription>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdraw">Withdrawals</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="payout">Payouts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {transactions.length === 0 ? "No transactions yet" : "No transactions match your search"}
              </h3>
              <p className="text-muted-foreground">
                {transactions.length === 0
                  ? "Your transaction history will appear here once you make your first transaction."
                  : "Try adjusting your search terms or filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx, index) => (
                <div key={tx.id}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">{getTransactionIcon(tx.type)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold capitalize">{tx.type}</p>
                          <Badge variant="outline" className="text-xs">
                            {tx.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tx.description}</p>
                        {tx.property_title && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building className="h-3 w-3" />
                            <span>{tx.property_title}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(tx.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(tx.type)}`}>
                        {["withdraw", "withdrawal", "payment"].includes(tx.type.toLowerCase()) ? "-" : "+"}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                  {index < filteredTransactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
