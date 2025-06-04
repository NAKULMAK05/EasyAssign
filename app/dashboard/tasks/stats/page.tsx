"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  Star,
  DollarSign,
  Target,
  Activity,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface JwtPayload {
  _id: string
  role: string
}

interface ClientStats {
  totalTasksPublished: number
  tasksAccepted: number
  pendingTasks: number
  completionRate: number
  avgTimeToAccept: number
  averageFreelancerRating: number
  monthlyTrend: Array<{ month: string; tasksPublished: number; tasksAccepted: number }>
}

interface FreelancerStats {
  totalTasksAccepted: number
  completedTasks: number
  ongoingTasks: number
  tasksApplied: number
  monthlyEarnings: Array<{ month: string; earnings: number }>
  yearlyEarnings: number
  averageRatingReceived: number
  avgResponseTime: number
}

type StatsData = {
  clientStats?: ClientStats
  freelancerStats?: FreelancerStats
}

const CHART_COLORS = {
  primary: "#2563eb",
  secondary: "#64748b",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#0891b2",
}

export default function TaskStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [userRole, setUserRole] = useState<"student" | "freelancer" | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("12m")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found. Please login.")
        setIsLoading(false)
        return
      }
      try {
        const decoded: JwtPayload = jwtDecode<JwtPayload>(token)
        if (decoded.role?.toLowerCase() === "student") {
          setUserRole("student")
        } else if (decoded.role?.toLowerCase() === "freelancer") {
          setUserRole("freelancer")
        } else {
          setError("User role is not valid.")
        }
      } catch (err) {
        console.error("Error decoding token:", err)
        setError("Error decoding token. Please login again.")
      }
    }
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    setError("")
    try {
      if (typeof window === "undefined") return
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found. Please login.")
        setIsLoading(false)
        return
      }
      const response = await axios.get("http://localhost:5000/api/tasks/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data && response.data.stats && Object.keys(response.data.stats).length > 0) {
        setStats(response.data.stats)
      } else {
        if (userRole === "student") {
          setStats({
            clientStats: {
              totalTasksPublished: 0,
              tasksAccepted: 0,
              pendingTasks: 0,
              completionRate: 0,
              avgTimeToAccept: 0,
              averageFreelancerRating: 0,
              monthlyTrend: [],
            },
          })
        } else if (userRole === "freelancer") {
          setStats({
            freelancerStats: {
              totalTasksAccepted: 0,
              completedTasks: 0,
              ongoingTasks: 0,
              tasksApplied: 0,
              monthlyEarnings: [],
              yearlyEarnings: 0,
              averageRatingReceived: 0,
              avgResponseTime: 0,
            },
          })
        }
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err)
      setError(err.response?.data?.message || "Failed to load statistics")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userRole) {
      fetchStats()
    }
  }, [userRole])

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: "neutral" as const }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      direction: change > 0 ? ("up" as const) : change < 0 ? ("down" as const) : ("neutral" as const),
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const clientStats = stats?.clientStats ?? {
    totalTasksPublished: 0,
    tasksAccepted: 0,
    pendingTasks: 0,
    completionRate: 0,
    avgTimeToAccept: 0,
    averageFreelancerRating: 0,
    monthlyTrend: [],
  }

  const freelancerStats = stats?.freelancerStats ?? {
    totalTasksAccepted: 0,
    completedTasks: 0,
    ongoingTasks: 0,
    tasksApplied: 0,
    monthlyEarnings: [],
    yearlyEarnings: 0,
    averageRatingReceived: 0,
    avgResponseTime: 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {userRole === "student" ? "Client Performance Analytics" : "Freelancer Performance Analytics"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="12m">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                  <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-gray-100">
              Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-gray-100">
              Trends
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-gray-100">
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Client Overview */}
          {userRole === "student" && (
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Published</CardTitle>
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{clientStats.totalTasksPublished}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1 text-green-600" />
                      <span>+12% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Tasks Accepted</CardTitle>
                    <Target className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{clientStats.tasksAccepted}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <span className="text-orange-600">{clientStats.pendingTasks} pending</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                    <PieChart className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{clientStats.completionRate}%</div>
                    <Progress value={clientStats.completionRate} className="mt-2 h-2" />
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{clientStats.avgTimeToAccept}h</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <ArrowDownRight className="w-3 h-3 mr-1 text-green-600" />
                      <span>-8% improvement</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Task Activity Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientStats.monthlyTrend?.length ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={clientStats.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="tasksPublished"
                              stackId="1"
                              stroke={CHART_COLORS.primary}
                              fill={CHART_COLORS.primary}
                              fillOpacity={0.6}
                              name="Published"
                            />
                            <Area
                              type="monotone"
                              dataKey="tasksAccepted"
                              stackId="1"
                              stroke={CHART_COLORS.success}
                              fill={CHART_COLORS.success}
                              fillOpacity={0.6}
                              name="Accepted"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-500">No trend data available</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Freelancer Rating</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(clientStats.averageFreelancerRating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{clientStats.averageFreelancerRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <Progress value={(clientStats.averageFreelancerRating / 5) * 100} className="h-2" />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{clientStats.tasksAccepted}</div>
                        <div className="text-xs text-gray-600">Accepted Tasks</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{clientStats.pendingTasks}</div>
                        <div className="text-xs text-gray-600">Pending Tasks</div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Success Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{clientStats.completionRate}%</div>
                      <div className="text-xs text-blue-700">Above industry average</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Freelancer Overview */}
          {userRole === "freelancer" && (
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Tasks Accepted</CardTitle>
                    <Target className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{freelancerStats.totalTasksAccepted}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1 text-green-600" />
                      <span>+18% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{freelancerStats.completedTasks}</div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <span className="text-orange-600">{freelancerStats.ongoingTasks} ongoing</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(freelancerStats.yearlyEarnings)}
                    </div>
                    <div className="flex items-center text-xs text-gray-600 mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1 text-green-600" />
                      <span>+24% this year</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Client Rating</CardTitle>
                    <Star className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {freelancerStats.averageRatingReceived.toFixed(1)}
                    </div>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(freelancerStats.averageRatingReceived)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Earnings Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {freelancerStats.monthlyEarnings?.length ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={freelancerStats.monthlyEarnings}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                              formatter={(value) => [formatCurrency(Number(value)), "Earnings"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="earnings"
                              stroke={CHART_COLORS.success}
                              strokeWidth={3}
                              dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: CHART_COLORS.success, strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-gray-500">
                        No earnings data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{freelancerStats.tasksApplied}</div>
                        <div className="text-xs text-gray-600">Applications</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{freelancerStats.avgResponseTime}h</div>
                        <div className="text-xs text-gray-600">Avg Response</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-sm font-medium">
                          {((freelancerStats.completedTasks / freelancerStats.totalTasksAccepted) * 100 || 0).toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={(freelancerStats.completedTasks / freelancerStats.totalTasksAccepted) * 100 || 0}
                        className="h-2"
                      />
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Monthly Average</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(freelancerStats.yearlyEarnings / 12)}
                      </div>
                      <div className="text-xs text-green-700">Based on yearly earnings</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white border border-gray-200 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">
                          {userRole === "student"
                            ? clientStats.completionRate
                            : freelancerStats.averageRatingReceived.toFixed(1)}
                        </div>
                        <div className="text-xs text-blue-700">
                          {userRole === "student" ? "Completion Rate" : "Average Rating"}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-900">
                          {userRole === "student" ? clientStats.avgTimeToAccept : freelancerStats.avgResponseTime}h
                        </div>
                        <div className="text-xs text-green-700">Response Time</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-900">
                          {userRole === "student" ? clientStats.tasksAccepted : freelancerStats.completedTasks}
                        </div>
                        <div className="text-xs text-purple-700">
                          {userRole === "student" ? "Accepted" : "Completed"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Benchmarks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Industry Average</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Your Performance</span>
                      <span className="font-medium text-green-600">
                        {userRole === "student"
                          ? clientStats.completionRate
                          : ((freelancerStats.completedTasks / freelancerStats.totalTasksAccepted) * 100 || 0).toFixed(
                              0,
                            )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        userRole === "student"
                          ? clientStats.completionRate
                          : (freelancerStats.completedTasks / freelancerStats.totalTasksAccepted) * 100 || 0
                      }
                      className="h-2"
                    />
                  </div>

                  <Separator />

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">Top 15%</div>
                    <div className="text-xs text-gray-600">Platform Ranking</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {userRole === "student" && clientStats.monthlyTrend?.length ? (
                      <BarChart data={clientStats.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar dataKey="tasksPublished" fill={CHART_COLORS.primary} name="Published" />
                        <Bar dataKey="tasksAccepted" fill={CHART_COLORS.success} name="Accepted" />
                      </BarChart>
                    ) : userRole === "freelancer" && freelancerStats.monthlyEarnings?.length ? (
                      <AreaChart data={freelancerStats.monthlyEarnings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value) => [formatCurrency(Number(value)), "Earnings"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke={CHART_COLORS.success}
                          fill={CHART_COLORS.success}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No trend data available
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Performance Trend</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {userRole === "student"
                            ? "Your task acceptance rate has improved by 15% this quarter"
                            : "Your completion rate is 20% above platform average"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Optimization Opportunity</h4>
                        <p className="text-sm text-green-700 mt-1">
                          {userRole === "student"
                            ? "Consider posting tasks during peak hours (9-11 AM) for faster acceptance"
                            : "Responding 2 hours faster could increase your success rate by 12%"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Market Insight</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {userRole === "student"
                            ? "Web development tasks have 40% higher acceptance rates"
                            : "Design projects show 25% higher client satisfaction rates"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Improve Response Time</h4>
                        <p className="text-sm text-gray-600">Target: Under 2 hours</p>
                      </div>
                      <Badge variant="secondary">High Impact</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {userRole === "student" ? "Detailed Descriptions" : "Portfolio Updates"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {userRole === "student" ? "Add more project details" : "Showcase recent work"}
                        </p>
                      </div>
                      <Badge variant="secondary">Medium Impact</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {userRole === "student" ? "Budget Optimization" : "Skill Diversification"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {userRole === "student" ? "Competitive pricing strategy" : "Learn trending skills"}
                        </p>
                      </div>
                      <Badge variant="secondary">Low Impact</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
