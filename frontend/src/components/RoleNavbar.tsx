"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Plus,
  FileText,
  Inbox,
  Wrench,
  BarChart3,
  BookUser,
  Search,
  Star,
  User,
  DollarSign,
  HelpCircle,
  RefreshCw,
  Menu,
  X,
} from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const storedRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole")
    setRole(storedRole)
  }, [])

  const switchRole = () => {
    if (!role) return
    const newRole = role === "provider" ? "seeker" : "provider"
    sessionStorage.setItem("userRole", newRole)
    localStorage.setItem("userRole", newRole)
    setRole(newRole)
    router.push(`/${newRole}`)
  }

  const commonLinks = [
    { label: "Account", href: "/common/account", icon: DollarSign },
    { label: "Support", href: "/common/support", icon: HelpCircle },
    { label: "Profile", href: "/common/profile", icon: User },
  ]

  const providerLinks = [
    { label: "Dashboard", href: "/provider", icon: Home },
    { label: "Add Property", href: "/provider/add-property", icon: Plus },
    { label: "My Properties", href: "/provider/my-properties", icon: FileText },
    { label: "Applications", href: "/provider/applications", icon: Inbox },
    { label: "Bookings", href: "/provider/bookings", icon: BookUser },
    { label: "Maintenance", href: "/provider/maintenance", icon: Wrench },
    { label: "Analytics", href: "/provider/analytics", icon: BarChart3 },
  ]

  const seekerLinks = [
    { label: "Dashboard", href: "/seeker", icon: Home },
    { label: "Explore", href: "/seeker/explore", icon: Search },
    { label: "Applications", href: "/seeker/applications", icon: FileText },
    { label: "My Rentals", href: "/seeker/active", icon: Inbox },
    { label: "Maintenance", href: "/seeker/maintenance", icon: Wrench },
    { label: "Reviews", href: "/seeker/reviews", icon: Star },
  ]

  const mainLinks = role === "provider" ? providerLinks : role === "seeker" ? seekerLinks : []

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg text-gray-900">PropEase</span>
                {role && (
                  <div className="text-xs text-gray-500 capitalize -mt-1">
                    {role === "provider" ? "Landlord Portal" : "Tenant Portal"}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center mx-8">
              {mainLinks.slice(0, 4).map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}

              {/* More menu for additional links */}
              {mainLinks.length > 4 && (
                <div className="relative group">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200">
                    <span>More</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      {mainLinks.slice(4).map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                              isActive ? "text-blue-700 bg-blue-50" : "text-gray-700"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Desktop Account Links */}
              <div className="hidden lg:flex items-center space-x-1">
                {commonLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        isActive ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                      title={link.label}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  )
                })}
              </div>

              {/* Role Switcher */}
              {role && (
                <button
                  onClick={switchRole}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">{role === "provider" ? "Tenant" : "Landlord"}</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {/* Main Navigation */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Navigation</div>
                {mainLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Account Links */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Account</div>
                <div className="space-y-1">
                  {commonLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          isActive ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
