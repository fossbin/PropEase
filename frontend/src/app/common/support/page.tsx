"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Calendar,
  User,
  Loader2,
  Send,
  TicketIcon,
} from "lucide-react"

interface Ticket {
  id: string
  subject: string
  priority: string
  description: string
  status: string
  role: string
  created_at: string
}

export default function CommonSupportPage() {
  const [formData, setFormData] = useState({
    subject: "",
    priority: "Medium",
    description: "",
    role: "",
  })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState("User")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    const role = sessionStorage.getItem("userRole")
    setUserRole(role || "User")

    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/support-tickets`, {
          headers: {
            "X-User-Id": userId || "",
          },
        })
        const data = await res.json()
        setTickets(data)
      } catch (err) {
        console.error("Failed to fetch tickets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePriorityChange = (value: string) => {
    setFormData({ ...formData, priority: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus("idle")

    const userId = sessionStorage.getItem("userId")

    try {
      const response = await fetch(`${API_BASE_URL}/api/support-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId || "",
        },
        body: JSON.stringify({ ...formData, role: userRole }),
      })

      if (response.ok) {
        setFormData({ subject: "", priority: "Medium", description: "", role: userRole || "User" })
        setSubmitStatus("success")
        setShowForm(false)

        // Refresh tickets
        setTimeout(() => {
          location.reload()
        }, 1000)
      } else {
        setSubmitStatus("error")
      }
    } catch (err) {
      console.error("Support ticket submission failed:", err)
      setSubmitStatus("error")
    } finally {
      setSubmitting(false)
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
        return "default"
      case "in progress":
        return "secondary"
      case "resolved":
        return "outline"
      case "closed":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <Clock className="h-3 w-3" />
      case "in progress":
        return <AlertTriangle className="h-3 w-3" />
      case "resolved":
        return <CheckCircle className="h-3 w-3" />
      case "closed":
        return <CheckCircle className="h-3 w-3" />
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
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Support Center
          </h1>
          <p className="text-muted-foreground">Get help and track your support requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="self-start sm:self-center">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Status Alert */}
      {submitStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Support ticket submitted successfully! We'll get back to you soon.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to submit support ticket. Please try again.</AlertDescription>
        </Alert>
      )}

      {/* New Ticket Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Create Support Ticket
            </CardTitle>
            <CardDescription>
              Describe your issue in detail and we'll help you resolve it as quickly as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          High
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                  rows={5}
                  required
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Submitting as: {userRole}</span>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tickets Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Support Tickets
              </CardTitle>
              <CardDescription>Track the status of your support requests</CardDescription>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {tickets.length === 0 ? "No support tickets yet" : "No tickets match your search"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {tickets.length === 0
                  ? "Create your first support ticket to get help with any issues."
                  : "Try adjusting your search terms or filters."}
              </p>
              {tickets.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket, index) => (
                <div key={ticket.id}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg leading-tight">{ticket.subject}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                            {ticket.priority}
                          </Badge>
                          <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status}</span>
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed">{ticket.description}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Role: {ticket.role}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TicketIcon className="h-3 w-3" />
                          <span>ID: {ticket.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < filteredTickets.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
