"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Star,
  IndianRupee,
  Users,
  Home,
  SlidersHorizontal,
  Grid3X3,
  List,
  Heart,
  Share2,
} from "lucide-react"
import useAuthRedirect from "@/hooks/useAuthRedirect"

interface Property {
  id: string
  title: string
  type: string
  transaction_type: string
  rating: number | null
  price: number
  photos: string[]
  city: string
  occupancy?: number
  capacity?: number
  address_line?: string
  state?: string
  verified?: boolean
  is_negotiable?: boolean
}

export default function ExplorePage() {
  useAuthRedirect()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [filters, setFilters] = useState({
    type: "",
    city: "",
    minRating: "",
    transaction_type: "",
    search: "",
    minPrice: "",
    maxPrice: "",
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("newest")

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const router = useRouter()

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams({
          ...(filters.type && { type: filters.type }),
          ...(filters.city && { city: filters.city }),
          ...(filters.minRating && { minRating: filters.minRating }),
          ...(filters.transaction_type && { transaction_type: filters.transaction_type }),
        })
        const res = await fetch(`${API_BASE_URL}/api/seeker/explore?${query.toString()}`)
        const data = await res.json()
        setProperties(data)
      } catch (err) {
        console.error("Error loading properties:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [filters.type, filters.city, filters.minRating, filters.transaction_type, API_BASE_URL])

  // Client-side filtering and sorting
  useEffect(() => {
    let filtered = [...properties]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.city.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.type.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter((p) => p.price >= Number.parseInt(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((p) => p.price <= Number.parseInt(filters.maxPrice))
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "newest":
      default:
        // Keep original order for newest
        break
    }

    setFilteredProperties(filtered)
  }, [properties, filters.search, filters.minPrice, filters.maxPrice, sortBy])

  const clearFilters = () => {
    setFilters({
      type: "",
      city: "",
      minRating: "",
      transaction_type: "",
      search: "",
      minPrice: "",
      maxPrice: "",
    })
  }

  const getTransactionBadge = (type: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
      Sale: { variant: "default", color: "bg-green-100 text-green-800" },
      Lease: { variant: "secondary", color: "bg-blue-100 text-blue-800" },
      PG: { variant: "outline", color: "bg-purple-100 text-purple-800" },
    }
    const config = variants[type] || { variant: "outline", color: "" }
    return (
      <Badge variant={config.variant} className={config.color}>
        {type}
      </Badge>
    )
  }

  const PropertyCard = ({ property }: { property: Property }) => {
    const isPG = property.transaction_type === "Subscription"
    const occupancy = property.occupancy ?? 0
    const capacity = property.capacity ?? 0
    const available = capacity - occupancy

    if (viewMode === "list") {
      return (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex">
              <div className="w-48 h-32 flex-shrink-0">
                {property.photos?.[0] ? (
                  <img
                    src={property.photos[0] || "/placeholder.svg"}
                    alt={property.title}
                    className="w-full h-full object-cover rounded-l-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-l-lg flex items-center justify-center">
                    <Home className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{property.city}</span>
                      {property.verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{property.type}</span>
                  </div>
                  {getTransactionBadge(property.transaction_type)}
                  {property.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-lg font-bold">{property.price.toLocaleString()}</span>
                    {property.is_negotiable && <span className="text-xs text-muted-foreground">(Negotiable)</span>}
                  </div>
                  {isPG && (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {occupancy}/{capacity} • {available} available
                      </span>
                    </div>
                  )}
                  <Button size="sm" onClick={() => router.push(`/seeker/explore/${property.id}`)}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="hover:shadow-md transition-shadow group">
        <CardContent className="p-0">
          <div className="relative">
            {property.photos?.[0] ? (
              <img
                src={property.photos[0] || "/placeholder.svg"}
                alt={property.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                <Home className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            {property.verified && <Badge className="absolute top-3 left-3 bg-green-100 text-green-800">Verified</Badge>}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{property.city}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{property.type}</span>
              </div>
              {getTransactionBadge(property.transaction_type)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                <span className="text-lg font-bold">{property.price.toLocaleString()}</span>
                {property.is_negotiable && <span className="text-xs text-muted-foreground">(Negotiable)</span>}
              </div>
              {property.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {isPG && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Users className="w-4 h-4" />
                <span>
                  {occupancy}/{capacity} occupied • {available} available
                </span>
              </div>
            )}

            <Button className="w-full" size="sm" onClick={() => router.push(`/seeker/explore/${property.id}`)}>
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Explore Properties</h1>
          <p className="text-muted-foreground mt-1">
            Discover your perfect home from {properties.length} available properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by title, city, or property type..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Select onValueChange={(val) => setFilters((f) => ({ ...f, type: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="PG">PG</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(val) => setFilters((f) => ({ ...f, transaction_type: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Transaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lease">Lease</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="PG">Subscription</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              />

              <Input
                placeholder="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
              />

              <Input
                placeholder="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
              />

              <Select onValueChange={(val) => setFilters((f) => ({ ...f, minRating: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Min Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredProperties.length} of {properties.length} properties
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms to find more properties.
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}
