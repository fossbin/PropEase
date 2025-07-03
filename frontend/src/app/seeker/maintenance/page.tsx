"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
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
} from "lucide-react"

function toast(arg0: { title: string; description: string; variant: string }) {
  throw new Error("Function not implemented.")
}

interface Property {
  id: string
  title: string
}

interface FormErrors {
  property?: string
  issueType?: string
  description?: string
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
  Low: { color: "bg-green-100 text-green-800", icon: Clock },
  Medium: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  High: { color: "bg-red-100 text-red-800", icon: AlertCircle },
}

export default function MaintenancePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState("")
  const [issueType, setIssueType] = useState("")
  const [customIssueType, setCustomIssueType] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchActiveProperties = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/seeker/active-properties`, {
          headers: {
            "X-User-Id": sessionStorage.getItem("userId") || "",
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch properties")
        }

        const data = await res.json()
        setProperties(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load active properties:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveProperties()
  }, [API_BASE_URL])

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

      const res = await fetch(`${API_BASE_URL}/api/seeker/maintenance`, {
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

      if (res.ok) {
        setSubmitted(true)
        toast({
          title: "Success!",
          description: "Your maintenance request has been submitted successfully.",
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
        throw new Error("Failed to submit maintenance ticket")
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to submit maintenance request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedIssueType = issueTypes.find((type) => type.value === issueType)
  const PriorityIcon = priorityConfig[priority as keyof typeof priorityConfig].icon

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-slate-600">Loading your properties...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Maintenance Request</h1>
          </div>
          <p className="text-slate-600">Submit a maintenance request for your property</p>
        </div>

        {/* Success State */}
        {submitted && !alertDismissed && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 flex items-center justify-between">
              <span>
                Your maintenance request has been submitted successfully! You'll receive updates on the progress.
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Properties</h3>
              <p className="text-slate-600">You don't have any active properties to submit maintenance requests for.</p>
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
              <CardDescription>Fill out the form below to submit your maintenance request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="property" className="text-sm font-medium">
                  Property *
                </Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className={errors.property ? "border-red-500" : ""}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-slate-500" />
                      <SelectValue placeholder="Select your property" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {property.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.property && <p className="text-sm text-red-600">{errors.property}</p>}
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
                    Submit Maintenance Request
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


