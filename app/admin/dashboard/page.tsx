"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Briefcase,
  DollarSign,
  Activity,
  MoreVertical,
  LogOut,
  Settings,
  Bell,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

interface DashboardData {
  adminName: string
  totals: {
    totalUsers: number
    totalTasks: number
    activeTasks: number
    completedTasks: number
    totalRevenue: number
    monthlyRevenue: number
  }
  tasksByCategory: { _id: string; count: number }[]
  tasksOverTime: { _id: { year: number; month: number }; count: number }[]
  monthlyTrends: { month: string; newUsers: number; newTasks: number; revenue: number }[]
  recentUsers: {
    _id: string
    name: string
    email: string
    role: string
    createdAt: string
    status: string
    avatar?: string
  }[]
  recentTasks: {
    _id: string
    title: string
    category: string
    status: string
    createdAt: string
    budget: number
    client: string
  }[]
  userGrowth: { month: string; users: number }[]
  taskCompletion: { status: string; count: number }[]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    async function fetchAdminData() {
      try {
        setIsRefreshing(true)
        const token = localStorage.getItem("adminToken")
        const res = await axios.get("http://localhost:5000/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setData(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch admin data")
      } finally {
        setIsRefreshing(false)
      }
    }
    fetchAdminData()
  }, [refresh])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    
    router.push("/admin/login")
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      const token = localStorage.getItem("adminToken")
      await axios.delete(`http://localhost:5000/api/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRefresh((prev) => prev + 1)
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete user")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return
    try {
      const token = localStorage.getItem("adminToken")
      await axios.delete(`http://localhost:5000/api/admin/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRefresh((prev) => prev + 1)
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete task")
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString()
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  }

  const barChartData = {
    labels: data?.tasksOverTime.map((item) => `${item._id.month}/${item._id.year}`) || [],
    datasets: [
      {
        label: "Tasks Created",
        data: data?.tasksOverTime.map((item) => item.count) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const pieChartData = {
    labels: data?.tasksByCategory.map((item) => item._id) || [],
    datasets: [
      {
        data: data?.tasksByCategory.map((item) => item.count) || [],
        backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#EC4899", "#14B8A6"],
        borderWidth: 0,
      },
    ],
  }

  const lineChartData = {
    labels: (data?.monthlyTrends || []).map((item) => item.month),
    datasets: [
      {
        label: "New Users",
        data: (data?.monthlyTrends || []).map((item) => item.newUsers),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "New Tasks",
        data: (data?.monthlyTrends || []).map((item) => item.newTasks),
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const revenueChartData = {
    labels: (data?.monthlyTrends || []).map((item) => item.month),
    datasets: [
      {
        label: "Revenue",
        data: (data?.monthlyTrends || []).map((item) => item.revenue || 0),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const taskStatusOrder = ["completed", "in progress", "pending", "cancelled"]
  const taskCompletionData = {
    labels: taskStatusOrder.map(
      (status) => status.charAt(0).toUpperCase() + status.slice(1)
    ),
    datasets: [
      {
        data: taskStatusOrder.map((status) => {
          const found = data?.taskCompletion.find(
            (item) => item.status.toLowerCase() === status
          )
          return found ? found.count : 0
        }),
        backgroundColor: [
          "#10B981", // Completed
          "#3B82F6", // In Progress
          "#F59E0B", // Pending
          "#EF4444", // Cancelled
        ],
        borderWidth: 0,
      },
    ],
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome back, {data.adminName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRefresh((prev) => prev + 1)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="m-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <main className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.totals.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+12%</span> from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.totals.totalTasks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+8%</span> from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.totals.activeTasks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-blue-600">+5%</span> from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.totals.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+15%</span> from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tasks Over Time</CardTitle>
                  <CardDescription>Monthly task creation trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Bar data={barChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tasks by Category</CardTitle>
                  <CardDescription>Distribution of task categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Pie data={pieChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Trends</CardTitle>
                  <CardDescription>User and task growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line data={lineChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Rate</CardTitle>
                  <CardDescription>Task status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Doughnut data={taskCompletionData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
  <CardHeader>
    <CardTitle>Recent Users</CardTitle>
    <CardDescription>Latest user registrations</CardDescription>
  </CardHeader>
  <CardContent>
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {data.recentUsers.slice(0, 5).map((user) => (
          <div key={user._id} className="flex items-center justify-between gap-4">
            {/* Avatar + Name + Email */}
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Centered Role Badge */}
            <div className="w-20 flex items-center justify-center shrink-0">
              <Badge variant={user.role === "client" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </div>

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/profile/${user._id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteUser(user._id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </ScrollArea>
  </CardContent>
</Card>


              <Card>
  <CardHeader>
    <CardTitle>Recent Tasks</CardTitle>
    <CardDescription>Latest task postings</CardDescription>
  </CardHeader>
  <CardContent>
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {data.recentTasks.slice(0, 5).map((task) => (
          <div
            key={task._id}
            className="flex items-center justify-between gap-4"
          >
            {/* Task title and category */}
            <div className="flex-1">
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.category}</p>
            </div>

            {/* Centered status and date */}
            <div className="flex flex-col items-center justify-center w-24 shrink-0 text-center">
              <Badge
                variant={
                  task.status === "completed"
                    ? "default"
                    : task.status === "active"
                    ? "secondary"
                    : "outline"
                }
              >
                {task.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(task.createdAt)}
              </p>
            </div>

            {/* Dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/task/${task._id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </ScrollArea>
  </CardContent>
</Card>

            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage registered users and their accounts</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {data.recentUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={user.role === "client" ? "default" : "secondary"}>{user.role}</Badge>
                              <Badge variant={user.status === "active" ? "default" : "outline"}>
                                {user.status || "active"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Redirect to user's profile */}
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/profile/${user._id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteUser(user._id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Task Management</CardTitle>
                    <CardDescription>Monitor and manage all tasks on the platform</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {data.recentTasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge variant="outline">{task.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Client: {task.client || "Unknown"}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Budget: {formatCurrency(task.budget || 0)}</span>
                            <span>Created: {formatDate(task.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "active"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {task.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Redirect to task details */}
                              <DropdownMenuItem onClick={() => router.push(`/task/${task._id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteTask(task._id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Monthly revenue trends and projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line data={revenueChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Task Completion Rate</span>
                    <span className="text-sm text-muted-foreground">87%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "87%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-sm text-muted-foreground">4.8/5</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Uptime</span>
                    <span className="text-sm text-muted-foreground">99.9%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.9%" }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Detailed insights and business intelligence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">2.4x</div>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">$1.2M</div>
                    <p className="text-sm text-muted-foreground">Total GMV</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">94%</div>
                    <p className="text-sm text-muted-foreground">Retention Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}