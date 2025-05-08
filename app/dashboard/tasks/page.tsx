"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DollarSign, Clock, Calendar, Loader2, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Users, AlertCircle, CheckCircle, XCircle, ArrowUpDown, ChevronDown } from 'lucide-react'
import axios from "axios"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface Task {
  _id: string
  id?: string
  title: string
  description: string
  category: string
  budget: string | number
  deadline: string
  status: string
  applicants?: number
  applications?: any[]
  createdAt?: string
  client?: {
    name: string
    avatar?: string
  }
}

export default function MyTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "all",
    sort: "newest",
  })

  const [activeTab, setActiveTab] = useState("all")
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Function to fetch tasks using applied filters
  async function fetchMyTasks() {
    setIsLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const params: any = {}
      if (appliedFilters.search) params.search = appliedFilters.search
      if (appliedFilters.category && appliedFilters.category !== "all") {
        params.category = appliedFilters.category
      }
      if (appliedFilters.sort) params.sort = appliedFilters.sort

      const response = await axios.get("http://localhost:5000/api/tasks/my", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setTasks(response.data.tasks)
      setFilteredTasks(response.data.tasks)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch my tasks")
    } finally {
      setIsLoading(false)
    }
  }

  // Initially fetch tasks using default filters
  useEffect(() => {
    fetchMyTasks()
  }, [])

  // When tasks or activeTab changes, update filteredTasks
  useEffect(() => {
    let result = [...tasks]
    if (activeTab !== "all") {
      result = result.filter((task) => task.status === activeTab)
    }
    setFilteredTasks(result)
  }, [tasks, activeTab])

  // Handle Apply Filters button click
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      category: categoryFilter,
      sort: sortBy,
    })
    fetchMyTasks()
  }

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return
    
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`http://localhost:5000/api/tasks/${deleteTaskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTasks((prev) => prev.filter((task) => task._id !== deleteTaskId))
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete task")
    } finally {
      setIsDeleting(false)
      setDeleteTaskId(null)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  // Get days remaining until deadline
  const getDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Get status badge based on task status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500 text-white">Active</Badge>
        )
      case "assigned":
        return (
          <Badge className="bg-blue-500 text-white">Assigned</Badge>
        )
      case "completed":
        return (
          <Badge className="bg-gray-500 text-white">Completed</Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get progress percentage based on task status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "active":
        return 25
      case "assigned":
        return 75
      case "completed":
        return 100
      default:
        return 0
    }
  }

  const categories = [
    "Web Development",
    "Mobile Development",
    "Design",
    "Writing",
    "Data Science",
    "Other",
  ]

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-screen-xl py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track your posted tasks</p>
        </div>
        <Button asChild>
          <Link href="/task/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filter Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((ctg) => (
                  <SelectItem key={ctg} value={ctg}>
                    {ctg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="budget-high">Budget High to Low</SelectItem>
                <SelectItem value="budget-low">Budget Low to High</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Tasks
            <Badge variant="secondary" className="ml-1">
              {tasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active
            <Badge variant="secondary" className="ml-1">
              {tasks.filter(t => t.status === "active").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            Assigned
            <Badge variant="secondary" className="ml-1">
              {tasks.filter(t => t.status === "assigned").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            Completed
            <Badge variant="secondary" className="ml-1">
              {tasks.filter(t => t.status === "completed").length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mt-1 max-w-md mx-auto mb-6">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters to see more results"
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} onDelete={() => setDeleteTaskId(task._id)} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No active tasks</h3>
                <p className="text-muted-foreground mt-1">
                  You don't have any active tasks at the moment
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} onDelete={() => setDeleteTaskId(task._id)} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="assigned" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No assigned tasks</h3>
                <p className="text-muted-foreground mt-1">
                  You don't have any assigned tasks at the moment
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} onDelete={() => setDeleteTaskId(task._id)} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No completed tasks</h3>
                <p className="text-muted-foreground mt-1">
                  You don't have any completed tasks yet
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard key={task._id || task.id} task={task} onDelete={() => setDeleteTaskId(task._id)} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTaskId)} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTask} 
              disabled={isDeleting}
              className="ml-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
  
  function TaskCard({ task, onDelete }: { task: Task; onDelete: () => void }) {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="line-clamp-1 text-lg">{task.title}</CardTitle>
            {getStatusBadge(task.status)}
          </div>
          <CardDescription className="flex items-center gap-1 mt-1">
            <Calendar className="h-3.5 w-3.5" />
            Posted on {formatDate(task.createdAt || "")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2">
          <p className="text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Budget</span>
              <span className="font-medium">${task.budget}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Deadline</span>
              <span className="font-medium">
                {formatDate(task.deadline)}
                {getDaysRemaining(task.deadline) <= 3 && (
                  <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5 bg-red-50 text-red-600 border-red-200">
                    {getDaysRemaining(task.deadline)} days left
                  </Badge>
                )}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span>{getProgressPercentage(task.status)}%</span>
            </div>
            <Progress value={getProgressPercentage(task.status)} className="h-1.5" />
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5">{task.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Users className="h-3.5 w-3.5" />
              <span>{task.applications?.length || task.applicants || 0} applicants</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 border-t flex justify-between items-center">
          <Badge variant="outline" className="bg-muted/50">
            <Eye className="h-3 w-3 mr-1" />
            {Math.floor(Math.random() * 100) + 20} views
          </Badge>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/task/edit/${task._id}`} className="flex items-center cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Task
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" asChild>
              <Link href={`/task/${task._id || task.id}`}>View Details</Link>
            </Button>
            
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/tasks/${task._id}/applicants`}>
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Applicants</span>
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }
}
