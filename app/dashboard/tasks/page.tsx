"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertCircle, Calendar, Clock, DollarSign, Loader2, Plus, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  _id: string
  id?: string
  title: string
  description: string
  category: string
  budget: string
  deadline: string
  status: string
  applicants: number
  createdAt?: string
  client?: {
    name: string
    avatar?: string
  }
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    async function fetchMyTasks() {
      setIsLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get("http://localhost:5000/api/tasks/my", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTasks(response.data.tasks)
        setFilteredTasks(response.data.tasks)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch my tasks")
      } finally {
        setIsLoading(false)
      }
    }
    fetchMyTasks()
  }, [])

  useEffect(() => {
    // Apply filters and search
    let result = [...tasks]

    // Filter by status (tab)
    if (activeTab !== "all") {
      result = result.filter((task) => task.status === activeTab)
    }

    // Filter by category
    if (categoryFilter !== "all") {
      result = result.filter((task) => task.category === categoryFilter)
    }

    // Search by title or description
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
      )
    }

    // Sort tasks
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime())
    } else if (sortBy === "budget-high") {
      result.sort(
        (a, b) =>
          Number.parseFloat(b.budget.replace(/[^0-9.-]+/g, "")) - Number.parseFloat(a.budget.replace(/[^0-9.-]+/g, "")),
      )
    } else if (sortBy === "budget-low") {
      result.sort(
        (a, b) =>
          Number.parseFloat(a.budget.replace(/[^0-9.-]+/g, "")) - Number.parseFloat(b.budget.replace(/[^0-9.-]+/g, "")),
      )
    }

    setFilteredTasks(result)
  }, [tasks, searchQuery, categoryFilter, sortBy, activeTab])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500 hover:bg-green-600">Open</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
      case "completed":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const categories = ["Web Development", "Mobile Development", "Design", "Writing", "Data Science", "Other"]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-screen-xl py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Manage and track your tasks</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/task/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="budget-high">Budget: High to Low</SelectItem>
              <SelectItem value="budget-low">Budget: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No tasks found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </p>
              {!searchQuery && categoryFilter === "all" && (
                <Button className="mt-4" asChild>
                  <Link href="/task/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium">No open tasks found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create a new task to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium">No in-progress tasks found</h3>
              <p className="text-muted-foreground mt-1">Tasks that are currently being worked on will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium">No completed tasks found</h3>
              <p className="text-muted-foreground mt-1">Completed tasks will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch (e) {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500 hover:bg-green-600">Open</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
      case "completed":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1 text-lg">{task.title}</CardTitle>
          {getStatusBadge(task.status)}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground line-clamp-2 text-sm mb-4">{task.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{task.budget}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{formatDate(task.deadline)}</span>
          </div>
        </div>

        {task.client && (
          <div className="mt-4 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.client.avatar} />
              <AvatarFallback>{task.client.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.client.name}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <Badge variant="outline">{task.category}</Badge>
        <Button size="sm" asChild>
          <Link href={`/task/${task._id || task.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

