"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Home,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  name: string
  photo?: string
  role?: string
}

export default function CommonHeader() {
  const router = useRouter()
  const pathname = usePathname()

  // Do not display header on login and register pages (also admin login/register)
 if (
  pathname === "/login" ||
  pathname === "/register" ||
  pathname === "/admin/register" ||
  pathname === "/admin/login" ||
  pathname === "/admin/dashboard" ||
  pathname.startsWith("/dashboard/profile/") ||
  pathname.startsWith("/task/")
) {
  return null
}

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [notificationCount, setNotificationCount] = useState(3)

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data?.message && data.message.toLowerCase().includes("jwt")) {
          localStorage.removeItem("token")
          setUser(null)
        } else {
          setUser(data)
        }
      } catch (error: any) {
        console.error("Error fetching user profile", error)
        localStorage.removeItem("token")
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Determine if logged in user is an admin
  const isAdmin = user?.role?.toLowerCase() === "admin"

  // When a user is an admin, regardless of route, display the simplified header.
  if (isAdmin) {
    return (
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          theme === "light"
            ? "bg-white/80 text-gray-900 border-gray-200/50 shadow-sm"
            : "bg-gray-900/80 text-white border-gray-700/50 shadow-lg"
        }`}
      >
        <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold shadow-lg transition-all duration-300">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </Link>
          </div>
          {/* Minimal Admin Header: Only Theme Toggle and User Dropdown with admin name and logout */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-12 px-3 rounded-xl hover:bg-primary/10 transition-all duration-200"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      {user && user.photo ? (
                        <AvatarImage
                          src={
                            user.photo.startsWith("http")
                              ? user.photo
                              : `http://localhost:5000${user.photo}`
                          }
                          alt={user.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {user ? user.name.charAt(0) : "AD"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user ? user.name : "Admin"}</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-2 rounded-xl border-0 shadow-xl bg-background/95 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user && user.photo ? (
                        <AvatarImage
                          src={
                            user.photo.startsWith("http")
                              ? user.photo
                              : `http://localhost:5000${user.photo}`
                          }
                          alt={user.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {user ? user.name.charAt(0) : "AD"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user ? user.name : "Admin"}</p>
                      <p className="text-xs text-muted-foreground">Admin</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg p-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    )
  }

  // Non-admin header: Full navigation, search bar, notifications, etc.
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    {
      href: user?.role?.toLowerCase() === "student" ? "/dashboard/tasks" : "/task/MyAppliedTask",
      label: user?.role?.toLowerCase() === "student" ? "My Tasks" : "My Applied Tasks",
      icon: MessageSquare,
    },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        theme === "light"
          ? "bg-white/80 text-gray-900 border-gray-200/50 shadow-sm"
          : "bg-gray-900/80 text-white border-gray-700/50 shadow-lg"
      }`}
    >
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left: Logo and navigation toggle */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 transition-colors duration-200 rounded-xl"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 border-r-0">
                  <VisuallyHidden>
                    <h2>Mobile Menu</h2>
                  </VisuallyHidden>
                  <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
                    {/* Mobile Header */}
                    <div className="flex items-center gap-3 p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          TaskHub
                        </h1>
                        <p className="text-xs text-muted-foreground">Freelancing Platform</p>
                      </div>
                    </div>
                    {/* Mobile Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link href={item.href}>
                              <Icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                              <span className="font-medium">{item.label}</span>
                            </Link>
                          </Button>
                        )
                      })}
                    </nav>
                    {/* Mobile Footer */}
                    <div className="mt-auto p-4 border-t bg-muted/20">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        <span className="font-medium">Logout</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold shadow-lg transition-all duration-300 group-hover:scale-105">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  TaskHub
                </h1>
              </div>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all duration-200 group text-sm font-medium"
                  >
                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, freelancers..."
                className="pl-10 pr-4 h-10 rounded-xl border-0 bg-muted/50 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/notifications")}
              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200 relative"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 animate-pulse">
                  {notificationCount}
                </Badge>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-12 px-3 rounded-xl hover:bg-primary/10 transition-all duration-200"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      {user && user.photo ? (
                        <AvatarImage
                          src={user.photo.startsWith("http") ? user.photo : `http://localhost:5000${user.photo}`}
                          alt={user.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {user ? user.name.charAt(0) : "JD"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{user ? user.name : "John Doe"}</p>
                    <p className="text-xs text-muted-foreground">{user?.role || "Freelancer"}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-2 rounded-xl border-0 shadow-xl bg-background/95 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user && user.photo ? (
                        <AvatarImage
                          src={user.photo.startsWith("http") ? user.photo : `http://localhost:5000${user.photo}`}
                          alt={user.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {user ? user.name.charAt(0) : "JD"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user ? user.name : "John Doe"}</p>
                      <p className="text-xs text-muted-foreground">{user?.role || "Freelancer"}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg p-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}