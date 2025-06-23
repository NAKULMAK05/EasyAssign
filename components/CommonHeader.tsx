"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Zap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface UserProfile {
  _id?: string;
  name: string;
  photo?: string;
  role?: string;
}

export default function CommonHeader() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide header on specific pages.
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/register" ||
    pathname === "/admin/login" ||
    pathname === "/admin/dashboard" ||
    pathname.startsWith("/dashboard/profile/")
  ) {
    return null;
  }

  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ tasks: any[]; users: any[] }>({
    tasks: [],
    users: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  // Navigation items for header (Settings will be in dropdown)
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    {
      href:
        user?.role?.toLowerCase() === "student"
          ? "/dashboard/tasks"
          : "/task/MyAppliedTask",
      label:
        user?.role?.toLowerCase() === "student"
          ? "My Tasks"
          : "My Applied Tasks",
      icon: MessageSquare,
    },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  // Helper: get active classes for header links.
  const getNavItemClasses = (href: string) => {
    const baseClasses =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    const activeClasses =
      theme === "light" ? "bg-gray-200 text-gray-900" : "bg-gray-700 text-white";
    return pathname === href ? `${baseClasses} ${activeClasses}` : baseClasses;
  };

  // Retrieve stored theme from localStorage on mount.
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  // Debounced search effect: now using new API endpoint /api/search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        const token = localStorage.getItem("token");
        fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        })
          .then(async (res) => {
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(errorText);
            }
            return res.json();
          })
          .then((data) => {
            setSearchResults({
              tasks: data.tasks || [],
              users: data.users || [],
            });
            setIsSearching(false);
          })
          .catch((err) => {
            console.error("Error performing search:", err);
            setSearchResults({ tasks: [], users: [] });
            setIsSearching(false);
          });
      } else {
        setSearchResults({ tasks: [], users: [] });
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch user profile.
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        const data = await res.json();
        if (data?.message && data.message.toLowerCase().includes("jwt")) {
          localStorage.removeItem("token");
          setUser(null);
        } else {
          setUser(data);
        }
      } catch (error: any) {
        console.error("Error fetching user profile", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  // Toggle theme and store choice.
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        theme === "light"
          ? "bg-white/80 text-gray-900 border-gray-200/50 shadow-sm"
          : "bg-gray-900/80 text-white border-gray-700/50 shadow-lg"
      }`}
    >
      <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
        {/* Left: Logo and Website Name and Navigation Links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold shadow-lg transition-all duration-300 group-hover:scale-105">
                <Zap className="h-5 w-5" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                TaskHub
              </h1>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-2">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} className={getNavItemClasses(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Center: Real-Time Search Bar */}
        <div className="flex-1 max-w-md mx-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users and tasks..."
              className="pl-10 pr-4 h-10 rounded-xl border-0 bg-muted/50 focus:bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {(isSearching ||
            searchResults.tasks.length > 0 ||
            searchResults.users.length > 0) && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </div>
              ) : (
                <>
                  {searchResults.tasks.length > 0 && (
                    <div className="p-2">
                      <h3 className="px-2 py-1 text-xs uppercase font-semibold text-gray-500">
                        Tasks
                      </h3>
                      {searchResults.tasks.map((t: any) => (
                        <div
                          key={t._id}
                          className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            router.push(`/task/${t._id}`);
                            setSearchQuery("");
                            setSearchResults({ tasks: [], users: [] });
                          }}
                        >
                          <p className="font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.category} &middot; {t.description.slice(0, 50)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.users.length > 0 && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="px-2 py-1 text-xs uppercase font-semibold text-gray-500">
                        Users
                      </h3>
                      {searchResults.users.map((u: any) => (
                        <div
                          key={u._id}
                          className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            router.push(`/dashboard/profile/${u._id}`);
                            setSearchQuery("");
                            setSearchResults({ tasks: [], users: [] });
                          }}
                        >
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {/* Right: Theme toggle, Chat icon, and Profile Dropdown (including Settings link in dropdown) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/notifications")}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200 relative"
          >
            <MessageSquare className="h-5 w-5" />
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
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
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
  );
}