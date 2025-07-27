"use client"

import { useEffect, useState } from "react"
import {
  Wrench,
  Home,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Building,
  FileText,
  Clock,
  AlertCircle,
  Zap,
  Droplets,
  Thermometer,
  Wifi,
  Shield,
  Settings,
  X,
  MapPin,
  User,
  History,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Property {
  id: string
  title: string
  address?: string
}

interface MaintenanceTicket {
  id: string
  property_id: string
  issue_type: string
  description: string
  status: string
  priority: string
  created_at: string
  property_title: string
  assigned_to_name: string
}

interface FormErrors {
  property?: string
  issueType?: string
  description?: string
}

interface ToastProps {
  title: string
  description: string
  variant: string
}

// Mock toast function - replace with your actual toast implementation
function toast({ title, description, variant }: ToastProps) {
  console.log(`Toast: ${title} - ${description} (${variant})`)
}

const issueTypes = [
  { value: "plumbing", label: "Plumbing", icon: Droplets },
  { value: "electrical", label: "Electrical", icon: Zap },
  { value: "heating", label: "Heating/Cooling", icon: Thermometer },
  { value: "internet", label: "Internet/WiFi", icon: Wifi },
  { value: "security", label: "Security", icon: Shield },
  { value: "appliances", label: "Appliances", icon: Settings },
  { value: "other", label: "Other", icon: Wrench },
]

const priorityConfig = {
  Low: { color: "bg-green-100 text-green-800 border-green-200", icon: Clock },
  Medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle },
  High: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
}

const statusConfig = {
  Open: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  "In Progress": { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Settings },
  "Resolved": { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  "Closed": { color: "bg-gray-100 text-gray-800 border-gray-200", icon: X },
}

export default function MaintenancePage() {
  useAuthRedirect()
  const [activeTab, setActiveTab] = useState("submit") // "submit" or "track"
  const [properties, setProperties] = useState<Property[]>([])
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [selectedProperty, setSelectedProperty] = useState("")
  const [issueType, setIssueType] = useState("")
  const [customIssueType, setCustomIssueType] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchSubscriptionProperties = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/maintenance/subscription-properties`, {
          headers: {
            "X-User-Id": sessionStorage.getItem("userId") || "",
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Please log in to continue")
          }
          throw new Error("Failed to fetch properties")
        }

        const data = await res.json()
        setProperties(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load subscription properties:", err)
        toast({
          title: "Error",
          description: "Failed to load your rented properties. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionProperties()
  }, [API_BASE_URL])

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/maintenance/raised`, {
        headers: {
          "X-User-Id": sessionStorage.getItem("userId") || "",
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        throw new Error("Failed to fetch tickets")
      }

      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load maintenance tickets:", err)
      toast({
        title: "Error",
        description: "Failed to load your maintenance tickets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTicketsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "track") {
      fetchTickets()
    }
  }, [activeTab, API_BASE_URL])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!selectedProperty) {
      newErrors.property = "Please select a property"
    }

    if (!issueType) {
      newErrors.issueType = "Please select an issue type"
    }

    if (issueType === "other" && !customIssueType.trim()) {
      newErrors.issueType = "Please specify the issue type"
    }

    if (!description.trim()) {
      newErrors.description = "Please describe the issue"
    } else if (description.trim().length < 10) {
      newErrors.description = "Please provide more details (at least 10 characters)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const finalIssueType = issueType === "other" ? customIssueType : issueType

      const res = await fetch(`${API_BASE_URL}/api/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
        body: JSON.stringify({
          property_id: selectedProperty,
          issue_type: finalIssueType,
          priority,
          description,
        }),
      })

      const responseData = await res.json()

      if (res.ok) {
        setSubmitted(true)
        toast({
          title: "Success!",
          description: "Your maintenance request has been submitted and assigned to your property provider.",
          variant: "default",
        })

        // Reset form
        setTimeout(() => {
          setIssueType("")
          setCustomIssueType("")
          setPriority("Medium")
          setDescription("")
          setSelectedProperty("")
          setSubmitted(false)
          setAlertDismissed(false)
          setErrors({})
        }, 3000)
      } else {
        throw new Error(responseData.detail || "Failed to submit maintenance ticket")
      }
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : "Failed to submit maintenance request. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTicketExpansion = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets)
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId)
    } else {
      newExpanded.add(ticketId)
    }
    setExpandedTickets(newExpanded)
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

  const getIssueTypeIcon = (type: string) => {
    const issueType = issueTypes.find(t => t.value === type.toLowerCase())
    return issueType ? issueType.icon : Wrench
  }

  const selectedIssueType = issueTypes.find((type) => type.value === issueType)
  const PriorityIcon = priorityConfig[priority as keyof typeof priorityConfig].icon
  const selectedPropertyData = properties.find(p => p.id === selectedProperty)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-slate-600">Loading your rented properties...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Maintenance Center</h1>
          </div>
          <p className="text-slate-600">Submit and track maintenance requests for your rented properties</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow-sm border">
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === "submit"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <FileText className="h-4 w-4" />
            Submit Request
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === "track"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <History className="h-4 w-4" />
            Track Requests
            {tickets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {tickets.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Submit Request Tab */}
        {activeTab === "submit" && (
          <>
            {/* Success State */}
            {submitted && !alertDismissed && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 flex items-center justify-between">
                  <span>
                    Your maintenance request has been submitted and assigned to your property provider! You can track its progress in the "Track Requests" tab.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAlertDismissed(true)}
                    className="ml-4 h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* No Properties State */}
            {!loading && properties.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Subscriptions</h3>
                  <p className="text-slate-600 mb-4">
                    You don't have any active rental subscriptions to submit maintenance requests for.
                  </p>
                  <p className="text-sm text-slate-500">
                    Maintenance requests can only be submitted for properties where you have an active subscription.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Main Form */}
            {!loading && properties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Request Details
                  </CardTitle>
                  <CardDescription>Fill out the form below to submit your maintenance request to your property provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Property Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="property" className="text-sm font-medium">
                      Rented Property *
                    </Label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                      <SelectTrigger className={errors.property ? "border-red-500" : ""}>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-slate-500" />
                          <SelectValue placeholder="Select your rented property" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{property.title}</span>
                                {property.address && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {property.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.property && <p className="text-sm text-red-600">{errors.property}</p>}
                    {selectedPropertyData && (
                      <div className="text-xs text-slate-600 bg-slate-50 rounded p-2">
                        <strong>Selected:</strong> {selectedPropertyData.title}
                        {selectedPropertyData.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {selectedPropertyData.address}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Issue Type */}
                  <div className="space-y-2">
                    <Label htmlFor="issueType" className="text-sm font-medium">
                      Issue Type *
                    </Label>
                    <Select value={issueType} onValueChange={setIssueType}>
                      <SelectTrigger className={errors.issueType ? "border-red-500" : ""}>
                        <div className="flex items-center gap-2">
                          {selectedIssueType && <selectedIssueType.icon className="h-4 w-4 text-slate-500" />}
                          <SelectValue placeholder="Select issue type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {issueTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.issueType && <p className="text-sm text-red-600">{errors.issueType}</p>}
                  </div>

                  {/* Custom Issue Type */}
                  {issueType === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customIssueType" className="text-sm font-medium">
                        Specify Issue Type *
                      </Label>
                      <Input
                        id="customIssueType"
                        placeholder="e.g., Window repair, Door lock issue"
                        value={customIssueType}
                        onChange={(e) => setCustomIssueType(e.target.value)}
                        className={errors.issueType ? "border-red-500" : ""}
                      />
                    </div>
                  )}

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">
                      Priority Level
                    </Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <PriorityIcon className="h-4 w-4 text-slate-500" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([level, config]) => {
                          const Icon = config.icon
                          return (
                            <SelectItem key={level} value={level}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{level}</span>
                                <Badge variant="secondary" className={`ml-2 ${config.color}`}>
                                  {level}
                                </Badge>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Issue Description *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about the issue, including location within the property, when it started, and any relevant details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
                    />
                    <div className="flex justify-between items-center">
                      {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                      <p className="text-xs text-slate-500 ml-auto">{description.length}/500 characters</p>
                    </div>
                  </div>

                  {/* Priority Info */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Priority Guidelines:</strong>
                      <br />
                      <span className="text-sm">
                        • <strong>High:</strong> Safety hazards, no heat/AC, major leaks
                        <br />• <strong>Medium:</strong> Appliance issues, minor leaks, electrical problems
                        <br />• <strong>Low:</strong> Cosmetic issues, non-essential repairs
                      </span>
                    </AlertDescription>
                  </Alert>

                  {/* Provider Info */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <User className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Request Process:</strong>
                      <br />
                      <span className="text-sm">
                        Your request will be sent directly to your property provider who will handle the maintenance issue. 
                        You'll receive updates on the progress and resolution.
                      </span>
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || submitted}
                    className="w-full py-3 text-lg"
                    size="lg"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting Request...
                      </div>
                    ) : submitted ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Request Submitted
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Submit to Property Provider
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Track Requests Tab */}
        {activeTab === "track" && (
          <div className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your Maintenance Requests</h2>
                <p className="text-sm text-slate-600">Track the status and progress of your submitted requests</p>
              </div>
              <Button
                onClick={fetchTickets}
                disabled={ticketsLoading}
                variant="outline"
                size="sm"
              >
                {ticketsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <History className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {/* Loading State */}
            {ticketsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-slate-600">Loading your maintenance requests...</p>
                </div>
              </div>
            )}

            {/* No Tickets State */}
            {!ticketsLoading && tickets.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Maintenance Requests</h3>
                  <p className="text-slate-600 mb-4">
                    You haven't submitted any maintenance requests yet.
                  </p>
                  <Button onClick={() => setActiveTab("submit")} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tickets List */}
            {!ticketsLoading && tickets.length > 0 && (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const IssueIcon = getIssueTypeIcon(ticket.issue_type)
                  const StatusIcon = statusConfig[ticket.status as keyof typeof statusConfig]?.icon || Clock
                  const isExpanded = expandedTickets.has(ticket.id)

                  return (
                    <Card key={ticket.id} className="overflow-hidden">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <IssueIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-base font-medium text-slate-900 mb-1">
                                    {ticket.issue_type.charAt(0).toUpperCase() + ticket.issue_type.slice(1)} Issue
                                  </CardTitle>
                                  <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {ticket.property_title}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(ticket.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant="secondary" 
                                  className={`${priorityConfig[ticket.priority as keyof typeof priorityConfig]?.color}`}
                                >
                                  {ticket.priority}
                                </Badge>
                                <Badge 
                                  variant="secondary"
                                  className={`${statusConfig[ticket.status as keyof typeof statusConfig]?.color}`}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {ticket.status}
                                </Badge>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 border-t bg-slate-50">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-slate-700">Description</Label>
                                <p className="mt-1 text-sm text-slate-600 bg-white rounded p-3 border">
                                  {ticket.description}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-slate-700">Assigned Provider</Label>
                                  <div className="mt-1 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm text-slate-600">
                                      {ticket.assigned_to_name || "Provider"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-slate-700">Request ID</Label>
                                  <div className="mt-1">
                                    <span className="text-sm font-mono text-slate-600 bg-white rounded px-2 py-1 border">
                                      {ticket.id.substring(0, 8)}...
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {ticket.status === "Resolved" && (
                                <Alert className="border-green-200 bg-green-50">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <AlertDescription className="text-green-800">
                                    <strong>Issue Resolved!</strong>
                                    <br />
                                    <span className="text-sm">
                                      Your maintenance request has been completed by the property provider. 
                                      If you're not satisfied with the resolution, please contact your provider directly.
                                    </span>
                                  </AlertDescription>
                                </Alert>
                              )}

                              {ticket.status === "In Progress" && (
                                <Alert className="border-orange-200 bg-orange-50">
                                  <Settings className="h-4 w-4 text-orange-600" />
                                  <AlertDescription className="text-orange-800">
                                    <strong>Work In Progress</strong>
                                    <br />
                                    <span className="text-sm">
                                      Your property provider is currently working on resolving this issue. 
                                      You'll be notified once it's completed.
                                    </span>
                                  </AlertDescription>
                                </Alert>
                              )}

                              {ticket.status === "Open" && (
                                <Alert className="border-blue-200 bg-blue-50">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <AlertDescription className="text-blue-800">
                                    <strong>Request Pending</strong>
                                    <br />
                                    <span className="text-sm">
                                      Your request has been sent to your property provider and is waiting to be reviewed. 
                                      You'll receive updates as the status changes.
                                    </span>
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Summary Stats */}
            {!ticketsLoading && tickets.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {tickets.length}
                      </div>
                      <div className="text-sm text-slate-600">Total Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {tickets.filter(t => t.status === "Open").length}
                      </div>
                      <div className="text-sm text-slate-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {tickets.filter(t => t.status === "In Progress").length}
                      </div>
                      <div className="text-sm text-slate-600">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {tickets.filter(t => t.status === "Resolved").length}
                      </div>
                      <div className="text-sm text-slate-600">Resolved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}