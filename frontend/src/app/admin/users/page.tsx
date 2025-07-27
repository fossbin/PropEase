"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabaseClient"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  Search,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Loader2,
  AlertTriangle,
  Filter,
  FileText,
  Shield,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface User {
  id: string
  name: string
  email: string
  phone_number: string | null
  picture: any // JSONB field
  created_at: string
}

interface UserDocument {
  id: string
  user_id: string
  document_type: string
  document_url: string
  verified: boolean
  uploaded_at: string
}

export default function AdminUsersPage() {
  useAuthRedirect()
  const [users, setUsers] = useState<User[]>([])
  const [userDocuments, setUserDocuments] = useState<Record<string, UserDocument[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [documentLoading, setDocumentLoading] = useState<Record<string, boolean>>({})
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false)

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

        // Fetch documents for all users
        await fetchAllUserDocuments(data)
      } catch (err) {
        console.error("Failed to load users:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const fetchAllUserDocuments = async (usersList: User[]) => {
    try {
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("Error fetching user documents:", error)
        return
      }

      // Group documents by user_id
      const documentsMap: Record<string, UserDocument[]> = {}
      data?.forEach((doc) => {
        if (!documentsMap[doc.user_id]) {
          documentsMap[doc.user_id] = []
        }
        documentsMap[doc.user_id].push(doc)
      })

      setUserDocuments(documentsMap)
    } catch (err) {
      console.error("Error fetching documents:", err)
    }
  }

  const handleVerifyDocument = async (documentId: string, userId: string) => {
    setDocumentLoading((prev) => ({ ...prev, [documentId]: true }))
    try {
      const { error } = await supabase.from("user_documents").update({ verified: true }).eq("id", documentId)

      if (error) {
        console.error("Error verifying document:", error)
        return
      }

      // Update local state
      setUserDocuments((prev) => ({
        ...prev,
        [userId]: prev[userId]?.map((doc) => (doc.id === documentId ? { ...doc, verified: true } : doc)) || [],
      }))
    } catch (err) {
      console.error("Verification failed:", err)
    } finally {
      setDocumentLoading((prev) => ({ ...prev, [documentId]: false }))
    }
  }

  const handleUnverifyDocument = async (documentId: string, userId: string) => {
    setDocumentLoading((prev) => ({ ...prev, [documentId]: true }))
    try {
      const { error } = await supabase.from("user_documents").update({ verified: false }).eq("id", documentId)

      if (error) {
        console.error("Error unverifying document:", error)
        return
      }

      setUserDocuments((prev) => ({
        ...prev,
        [userId]: prev[userId]?.map((doc) => (doc.id === documentId ? { ...doc, verified: false } : doc)) || [],
      }))
    } catch (err) {
      console.error("Unverification failed:", err)
    } finally {
      setDocumentLoading((prev) => ({ ...prev, [documentId]: false }))
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
      setUserDocuments((prev) => {
        const newDocs = { ...prev }
        delete newDocs[id]
        return newDocs
      })
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
    if (!name) return "NA"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getUserPictureUrl = (picture: any) => {
    if (!picture) return null

    if (typeof picture === "string") {
      return picture
    }

    if (picture && typeof picture === "object") {
      return picture.url || picture.src || picture.path || null
    }

    return null
  }

  const getUserDocumentStats = (userId: string) => {
    const docs = userDocuments[userId] || []
    const verified = docs.filter((doc) => doc.verified).length
    const total = docs.length
    return { verified, total }
  }

  const openDocumentsDialog = (user: User) => {
    setSelectedUser(user)
    setDocumentsDialogOpen(true)
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone_number ?? "").includes(searchTerm),
  )

  const totalVerifiedUsers = users.filter((user) => {
    const stats = getUserDocumentStats(user.id)
    return stats.verified > 0
  }).length

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
            <p className="text-muted-foreground">Manage users and verify their documents</p>
          </div>
        </div>
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
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalVerifiedUsers}</div>
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
              {filteredUsers.map((user) => {
                const documentStats = getUserDocumentStats(user.id)
                const userPictureUrl = getUserPictureUrl(user.picture)

                return (
                  <Card key={user.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                            />
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={userPictureUrl || "/placeholder.svg"} />
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
                            {documentStats.total > 0 && (
                              <Badge variant={documentStats.verified > 0 ? "default" : "secondary"}>
                                <FileText className="h-3 w-3 mr-1" />
                                {documentStats.verified}/{documentStats.total} Verified
                              </Badge>
                            )}
                            {documentStats.verified > 0 && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified User
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Joined: {formatDate(user.created_at)}</span>
                            </div>
                            {documentStats.total > 0 && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{documentStats.total} documents uploaded</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                          <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => openDocumentsDialog(user)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View Documents ({documentStats.total})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  Documents for {selectedUser?.name}
                                </DialogTitle>
                                <DialogDescription>Review and verify user documents</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {selectedUser && userDocuments[selectedUser.id]?.length > 0 ? (
                                  userDocuments[selectedUser.id].map((doc) => (
                                    <Card key={doc.id}>
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                            <div>
                                              <h4 className="font-medium">{doc.document_type}</h4>
                                              <div className="flex items-center gap-2 mt-1">
                                                {doc.verified ? (
                                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Verified
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                                                    Pending Verification
                                                  </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                  Uploaded {formatDate(doc.uploaded_at)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => window.open(doc.document_url)}
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              View
                                            </Button>
                                            {doc.verified ? (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleUnverifyDocument(doc.id, selectedUser.id)}
                                                disabled={documentLoading[doc.id]}
                                              >
                                                {documentLoading[doc.id] ? (
                                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                )}
                                                Unverify
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                onClick={() => handleVerifyDocument(doc.id, selectedUser.id)}
                                                disabled={documentLoading[doc.id]}
                                                className="bg-green-600 hover:bg-green-700"
                                              >
                                                {documentLoading[doc.id] ? (
                                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                )}
                                                Verify
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                                    <p>No documents uploaded by this user</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

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
                                  Are you sure you want to delete {user.name}? This action cannot be undone and will
                                  also delete all their documents.
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
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
