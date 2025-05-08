"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, ChevronDown, Filter, Calendar, Search, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Application {
  applicant: string;
  message: string;
  appliedAt: string;
  decision?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number | string;
  deadline: string;
  createdAt?: string;
  applications?: Application[];
  status?: string;
  client?: {
    _id: string;
    name: string;
    photo?: string;
  };
  acceptedBy?: string;
}

// Extend Task locally to add a temporary _decision property for filtering/sorting.
interface ExtendedTask extends Task {
  _decision: "pending" | "accepted" | "rejected";
}

export default function MyAppliedTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ExtendedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // "recent", "titleAsc", "titleDesc", "budgetHigh", "budgetLow"
  const [sortOption, setSortOption] = useState("recent");
  // statusFilter values: "all", "pending", "accepted", "rejected"
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawingTaskId, setWithdrawingTaskId] = useState<string | null>(null);
  const [confirmWithdrawTaskId, setConfirmWithdrawTaskId] = useState<string | null>(null);
  const [withdrawErrorDialog, setWithdrawErrorDialog] = useState<string | null>(null);

  const router = useRouter();

  // Fetch tasks the freelancer has applied to
  const fetchAppliedTasks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/tasks/applied", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch applied tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliedTasks();
  }, []);

  // Filter and sort tasks
  useEffect(() => {
    // Ensure we trim the user id from localStorage to avoid stray spaces.
    const userId = localStorage.getItem("userId")?.trim() || "";
    let updatedTasks: ExtendedTask[] = tasks.map((task) => {
      // Find user's application in this task
      const userApplication = task.applications?.find(
        (app) => app.applicant === userId
      );
      let decision: "pending" | "accepted" | "rejected" = "pending";
      // Check if the task is officially assigned to current user
      if (task.acceptedBy && task.acceptedBy.toString() === userId) {
        decision = "accepted";
      } else if (userApplication?.decision === "accepted") {
        decision = "accepted";
      } else if (userApplication?.decision === "declined") {
        decision = "rejected";
      } else {
        decision = "pending";
      }
      return { ...task, _decision: decision };
    });

    // Apply status filter if not "all"
    if (statusFilter !== "all") {
      updatedTasks = updatedTasks.filter(task => task._decision === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      updatedTasks = updatedTasks.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.category.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    if (sortOption === "recent") {
      updatedTasks.sort((a, b) =>
        new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
      );
    } else if (sortOption === "titleAsc") {
      updatedTasks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "titleDesc") {
      updatedTasks.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortOption === "budgetHigh") {
      updatedTasks.sort((a, b) => {
        const budgetA = typeof a.budget === "string" ? parseFloat(a.budget.replace(/[^0-9.-]+/g, "")) : Number(a.budget);
        const budgetB = typeof b.budget === "string" ? parseFloat(b.budget.replace(/[^0-9.-]+/g, "")) : Number(b.budget);
        return budgetB - budgetA;
      });
    } else if (sortOption === "budgetLow") {
      updatedTasks.sort((a, b) => {
        const budgetA = typeof a.budget === "string" ? parseFloat(a.budget.replace(/[^0-9.-]+/g, "")) : Number(a.budget);
        const budgetB = typeof b.budget === "string" ? parseFloat(b.budget.replace(/[^0-9.-]+/g, "")) : Number(b.budget);
        return budgetA - budgetB;
      });
    }
    
    setFilteredTasks(updatedTasks);
  }, [searchTerm, sortOption, statusFilter, tasks]);

  // Function to withdraw application
  const withdrawApplication = async (taskId: string) => {
    try {
      setWithdrawingTaskId(taskId);
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}/apply`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove the withdrawn task from the list
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
    } catch (error: any) {
      if (error.response?.data?.message && error.response.data.message.includes("already assigned")) {
        setWithdrawErrorDialog(error.response.data.message);
      } else {
        setWithdrawErrorDialog(error.response?.data?.message || "Failed to withdraw application");
      }
    } finally {
      setWithdrawingTaskId(null);
      setConfirmWithdrawTaskId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge based on application decision
  const getStatusBadge = (decision: string) => {
    switch (decision) {
      case "accepted":
        return <Badge className="bg-green-500 text-white">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>;
    }
  };

  // Calculate days remaining until deadline
  const getDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applied Tasks</h1>
          <p className="text-muted-foreground mt-1">Track and manage tasks you&apos;ve applied for</p>
        </div>
        <Button asChild variant="outline" className="self-start">
          <Link href="/dashboard">
            <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="titleAsc">Title (A-Z)</SelectItem>
                <SelectItem value="titleDesc">Title (Z-A)</SelectItem>
                <SelectItem value="budgetHigh">Budget (High-Low)</SelectItem>
                <SelectItem value="budgetLow">Budget (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No tasks found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search criteria or filters to see more results."
              : "You haven't applied to any tasks yet. Browse available tasks to get started."}
          </p>
          <Button asChild>
            <Link href="/dashboard">Browse Tasks</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const decision = task._decision;
            const userApplication = task.applications?.find(
              (app) => app.applicant === localStorage.getItem("userId")?.trim()
            );
            return (
              <Card key={task._id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{task.title}</CardTitle>
                    {getStatusBadge(decision)}
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Applied on {formatDate(userApplication?.appliedAt || "")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-primary/5">{task.category}</Badge>
                    {task.status && (
                      <Badge variant="secondary" className="bg-secondary/10">
                        {task.status}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t flex justify-between items-center">
                  {task.client && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.client.photo || "/placeholder.svg"} alt={task.client.name} />
                        <AvatarFallback>{task.client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{task.client.name}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {decision === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmWithdrawTaskId(task._id)}
                        disabled={withdrawingTaskId === task._id}
                      >
                        {withdrawingTaskId === task._id ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <X className="mr-1 h-3.5 w-3.5" />
                            Withdraw
                          </>
                        )}
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/task/${task._id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Withdrawal */}
      <Dialog
        open={Boolean(confirmWithdrawTaskId)}
        onOpenChange={(open) => {
          if (!open) setConfirmWithdrawTaskId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmWithdrawTaskId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmWithdrawTaskId && withdrawApplication(confirmWithdrawTaskId)}
              className="ml-2"
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog for Withdrawal Failure */}
      <Dialog
        open={Boolean(withdrawErrorDialog)}
        onOpenChange={(open) => {
          if (!open) setWithdrawErrorDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Error</DialogTitle>
            <DialogDescription>{withdrawErrorDialog}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setWithdrawErrorDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}