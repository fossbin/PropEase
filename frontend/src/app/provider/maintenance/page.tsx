"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Wrench,
  Building,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Play,
  Loader2,
  FileText,
} from "lucide-react"

interface Ticket {
  id: string
  property_title: string
  issue_type: string
  description: string
  status: "Open" | "In Progress" | "Closed"
  priority: "Low" | "Medium" | "High"
  raised_by_name: string
  created_at: string
}

export default function MaintenanceTicketsPage() {
  const [groupedTickets, setGroupedTickets] = useState<Record<string, Ticket[]>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")

    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/maintenance/assigned`, {
          headers: {
            "X-User-Id": userId || "",
            "Content-Type": "application/json",
          },
        })

        const data: Ticket[] = await res.json()
        const grouped: Record<string, Ticket[]> = {}

        for (const ticket of data) {
          const title = ticket.property_title
          if (!grouped[title]) grouped[title] = []
          grouped[title].push(ticket)
        }

        setGroupedTickets(grouped)
      } catch (err) {
        console.error("Failed to load maintenance tickets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const handleStatusChange = async (id: string, status: Ticket["status"]) => {
    setUpdating(id)
    try {
      await fetch(`${API_BASE_URL}/api/maintenance/${id}`, {
        method: "PATCH",
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      setGroupedTickets((prev) => {
        const updated = { ...prev }
        for (const prop in updated) {
          updated[prop] = updated[prop].map((t) => (t.id === id ? { ...t, status } : t))
        }
        return updated
      })
    } catch (err) {
      console.error("Failed to update ticket:", err)
    } finally {
      setUpdating(null)
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
      case "closed":
        return "secondary"
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
      case "closed":
        return <CheckCircle className="h-3 w-3" />
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

  // Filter tickets based on search and filters
  const filteredGroupedTickets = Object.entries(groupedTickets).reduce(
    (acc, [propertyTitle, tickets]) => {
      const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch =
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.raised_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase()
        const matchesPriority =
          priorityFilter === "all" || ticket.priority.toLowerCase() === priorityFilter.toLowerCase()

        return matchesSearch && matchesStatus && matchesPriority
      })

      if (filteredTickets.length > 0) {
        acc[propertyTitle] = filteredTickets
      }

      return acc
    },
    {} as Record<string, Ticket[]>,
  )

  const totalTickets = Object.values(groupedTickets).flat().length
  const openTickets = Object.values(groupedTickets)
    .flat()
    .filter((t) => t.status === "Open").length
  const inProgressTickets = Object.values(groupedTickets)
    .flat()
    .filter((t) => t.status === "In Progress").length

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading maintenance tickets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wrench className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Tickets</h1>
          <p className="text-muted-foreground">Manage and track property maintenance requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgressTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalTickets - openTickets - inProgressTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets, properties, or issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets by Property */}
      {Object.keys(filteredGroupedTickets).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {totalTickets === 0 ? "No maintenance tickets assigned" : "No tickets match your search"}
            </h3>
            <p className="text-muted-foreground">
              {totalTickets === 0
                ? "You don't have any maintenance tickets assigned to you yet."
                : "Try adjusting your search terms or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredGroupedTickets).map(([propertyTitle, tickets]) => (
            <Card key={propertyTitle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {propertyTitle}
                </CardTitle>
                <CardDescription>{tickets.length} maintenance request(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                                {getStatusIcon(ticket.status)}
                                <span className="ml-1">{ticket.status}</span>
                              </Badge>
                              <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                                {getPriorityIcon(ticket.priority)}
                                <span className="ml-1">{ticket.priority}</span>
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">{ticket.issue_type}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Raised by: {ticket.raised_by_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(ticket.created_at)}</span>
                          </div>
                        </div>

                        <Separator />

                        {/* Actions */}
                        {ticket.status !== "Closed" && (
                          <div className="flex gap-2">
                            {ticket.status === "Open" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(ticket.id, "In Progress")}
                                disabled={updating === ticket.id}
                                className="flex-1"
                              >
                                {updating === ticket.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3 mr-1" />
                                )}
                                Start Work
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleStatusChange(ticket.id, "Closed")}
                              disabled={updating === ticket.id}
                              className="flex-1"
                            >
                              {updating === ticket.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Complete
                            </Button>
                          </div>
                        )}

                        {ticket.status === "Closed" && (
                          <div className="text-center py-2">
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
