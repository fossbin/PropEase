"use client"

import { use, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  HelpCircle,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  TicketIcon,
  TrendingUp,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Ticket {
  id: string
  user_name: string
  subject: string
  priority: string
  description: string
  status: string
  role: string
  created_at: string
}

export default function AdminSupportTicketsPage() {
  useAuthRedirect()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")

    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/support-tickets`, {
          headers: {
            "X-User-Id": userId || "",
            "Content-Type": "application/json",
          },
        })
        const data = await res.json()
        setTickets(data)
      } catch (err) {
        console.error("Failed to fetch support tickets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API_BASE_URL}/api/admin/support-tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
        body: JSON.stringify({ status }),
      })
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    } catch (err) {
      console.error("Error updating status:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedTickets.map((id) => updateStatus(id, status)))
      setSelectedTickets([])
    } catch (err) {
      console.error("Bulk update failed:", err)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "destructive"
      case "in progress":
        return "default"
      case "resolved":
        return "secondary"
      case "closed":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <AlertTriangle className="h-3 w-3" />
      case "in progress":
        return <Clock className="h-3 w-3" />
      case "resolved":
        return <CheckCircle className="h-3 w-3" />
      case "closed":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case "medium":
        return <Clock className="h-3 w-3 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      default:
        return <Clock className="h-3 w-3" />
    }
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesPriority = priorityFilter === "all" || ticket.priority.toLowerCase() === priorityFilter.toLowerCase()
    const matchesRole = roleFilter === "all" || ticket.role.toLowerCase() === roleFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesPriority && matchesRole
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map((t) => t.id))
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId])
    } else {
      setSelectedTickets(selectedTickets.filter((id) => id !== ticketId))
    }
  }

  // Statistics
  const totalTickets = tickets.length
  const openTickets = tickets.filter((t) => t.status.toLowerCase() === "open").length
  const resolvedTickets = tickets.filter((t) => t.status.toLowerCase() === "resolved").length
  const highPriorityTickets = tickets.filter((t) => t.priority.toLowerCase() === "high").length

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading support tickets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Manage and respond to user support requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highPriorityTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets, users, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="seeker">Seeker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{selectedTickets.length} tickets selected</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate("Resolved")}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Mark Resolved
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkStatusUpdate("Closed")}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                Close All
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {totalTickets === 0 ? "No support tickets" : "No tickets match your search"}
            </h3>
            <p className="text-muted-foreground">
              {totalTickets === 0
                ? "Support tickets will appear here when users submit them."
                : "Try adjusting your search terms or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Tickets ({filteredTickets.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedTickets.length === filteredTickets.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTickets.includes(ticket.id)}
                          onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                        />
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg leading-tight">{ticket.subject}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1">{ticket.status}</span>
                            </Badge>
                            <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                              {getPriorityIcon(ticket.priority)}
                              <span className="ml-1">{ticket.priority}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {ticket.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Submitted by: {ticket.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TicketIcon className="h-3 w-3" />
                          <span>ID: {ticket.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    {ticket.status.toLowerCase() !== "closed" && (
                      <div className="flex gap-2">
                        {ticket.status.toLowerCase() !== "resolved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(ticket.id, "Resolved")}
                            disabled={actionLoading === ticket.id}
                            className="flex-1"
                          >
                            {actionLoading === ticket.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Mark Resolved
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(ticket.id, "Closed")}
                          disabled={actionLoading === ticket.id}
                          className="flex-1"
                        >
                          {actionLoading === ticket.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          Close Ticket
                        </Button>
                      </div>
                    )}

                    {ticket.status.toLowerCase() === "closed" && (
                      <div className="text-center py-2">
                        <Badge variant="outline" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Closed
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
