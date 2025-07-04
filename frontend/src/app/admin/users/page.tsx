"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Loader2,
  AlertTriangle,
  Plus,
  Filter,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  phone_number: string
  created_at?: string
  last_login?: string
  status?: "active" | "inactive"
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, Partial<User>>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": sessionStorage.getItem("userId") || "",
          },
        })
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error("Failed to load users:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleEdit = (user: User) => {
    setEditing((prev) => ({ ...prev, [user.id]: true }))
    setFormData((prev) => ({ ...prev, [user.id]: { name: user.name, phone_number: user.phone_number } }))
  }

  const handleCancel = (id: string) => {
    setEditing((prev) => ({ ...prev, [id]: false }))
    setFormData((prev) => ({ ...prev, [id]: {} }))
  }

  const handleSave = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
        body: JSON.stringify(formData[id]),
      })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...formData[id] } : u)))
      handleCancel(id)
    } catch (err) {
      console.error("Update failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": sessionStorage.getItem("userId") || "",
        },
      })
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setSelectedUsers((prev) => prev.filter((userId) => userId !== id))
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDelete = async () => {
    setBulkActionLoading(true)
    try {
      await Promise.all(selectedUsers.map((id) => handleDelete(id)))
      setSelectedUsers([])
    } catch (err) {
      console.error("Bulk delete failed:", err)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((u) => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };


  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.name??"").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email??"").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone_number??"").includes(searchTerm),
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-lg">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage and monitor user accounts</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === "active" || !u.status).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                users.filter((u) => {
                  if (!u.created_at) return false
                  const userDate = new Date(u.created_at)
                  const now = new Date()
                  return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{selectedUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{selectedUsers.length} users selected</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={bulkActionLoading}>
                  {bulkActionLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Users</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedUsers.length} selected users? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Users
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {users.length === 0 ? "No users found" : "No users match your search"}
            </h3>
            <p className="text-muted-foreground">
              {users.length === 0 ? "Users will appear here once they register." : "Try adjusting your search terms."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({filteredUsers.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox checked={selectedUsers.length === filteredUsers.length} onCheckedChange={handleSelectAll} />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    {editing[user.id] ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div>
                              <Label htmlFor={`name-${user.id}`}>Name</Label>
                              <Input
                                id={`name-${user.id}`}
                                value={formData[user.id]?.name || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [user.id]: { ...prev[user.id], name: e.target.value },
                                  }))
                                }
                                placeholder="Full Name"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`phone-${user.id}`}>Phone Number</Label>
                              <Input
                                id={`phone-${user.id}`}
                                value={formData[user.id]?.phone_number || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [user.id]: { ...prev[user.id], phone_number: e.target.value },
                                  }))
                                }
                                placeholder="Phone Number"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(user.id)} disabled={actionLoading === user.id}>
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Save Changes
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCancel(user.id)}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                            />
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">{user.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{user.phone_number || "N/A"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.status === "active" ? "default" : "secondary"}>
                              {user.status || "Active"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Joined: {formatDate(user.created_at)}</span>
                            </div>
                            {user.last_login && (
                              <div className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                <span>Last login: {formatDate(user.last_login)}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={actionLoading === user.id}>
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
