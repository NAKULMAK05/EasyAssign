"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Briefcase,
  Target,
  Award,
  Eye,
  Heart,
  BookOpen,
  Zap,
  Star,
  Grid3X3,
  List,
  ArrowUpRight,
  Sparkles,
  User,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CommonHeader from "@/components/CommonHeader";

const getStatusBadge = (status: string | undefined) => {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  switch (status.toLowerCase()) {
    case "active":
      return (
        <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 hover:from-emerald-200 hover:to-emerald-300 dark:from-emerald-950/50 dark:to-emerald-900/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
          Active
        </Badge>
      );
    case "assigned":
      return (
        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 hover:from-blue-200 hover:to-blue-300 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-lg">
          <Briefcase className="w-3 h-3 mr-1" />
          Assigned
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 dark:from-gray-950/50 dark:to-gray-900/50 dark:text-gray-300 border-gray-300 dark:border-gray-700 shadow-lg">
          <Award className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface Task {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  budget: number | string;
  deadline: string;
  status: string;
  applicants: number;
  acceptedBy?: any;
  // Field to indicate whether multiple freelancers can be accepted.
  allowMultiple?: boolean;
  createdAt?: string;
  client?: { name: string; avatar?: string };
  postedBy?: { name: string; photo?: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Create task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  
  const [user, setUser] = useState<any>(null);
  
  const categories = [
    "all",
    "Web Development",
    "Mobile Development",
    "Design",
    "Writing",
    "Marketing",
    "Data Science",
    "Other",
  ];
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user profile", error);
      }
    }
    fetchUser();
  }, []);
  
  useEffect(() => {
    async function fetchTasks() {
      setIsLoadingTasks(true);
      setFetchError("");
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data.tasks);
      } catch (error: any) {
        setFetchError(error.response?.data?.message || "Failed to fetch tasks");
      } finally {
        setIsLoadingTasks(false);
      }
    }
    fetchTasks();
  }, []);
  
  const filteredTasks = tasks
    .filter((task) => {
      const query = searchQuery.trim().toLowerCase();
      const categoryMatch = selectedCategory === "all" || task.category === selectedCategory;
      const searchMatch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime();
      } else if (sortBy === "budgetHigh") {
        return Number.parseFloat(b.budget.toString()) - Number.parseFloat(a.budget.toString());
      } else if (sortBy === "budgetLow") {
        return Number.parseFloat(a.budget.toString()) - Number.parseFloat(b.budget.toString());
      }
      return 0;
    });
  
  const isClient = user?.role?.toLowerCase() === "student";
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status?.toLowerCase() === "active").length;
  const avgBudget =
    totalTasks > 0 ? Math.round(tasks.reduce((acc, t) => acc + Number(t.budget), 0) / totalTasks) : 0;
  const totalCategories = new Set(tasks.map((t) => t.category)).size;
  
  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
    }
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleCreateTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");
    const trimmedTitle = newTitle.trim();
    const parsedBudget = Number.parseFloat(newBudget);
    if (!trimmedTitle) {
      setCreateError("Title is required.");
      setIsCreating(false);
      return;
    }
    if (isNaN(parsedBudget)) {
      setCreateError("Budget is required and must be a valid number.");
      setIsCreating(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("description", newDescription);
      formData.append("category", newCategory);
      formData.append("budget", parsedBudget.toString());
      formData.append("deadline", newDeadline ? new Date(newDeadline).toISOString() : "");
      formData.append("contactEmail", contactEmail);
      formData.append("contactPhone", contactPhone);
      formData.append("allowMultiple", allowMultiple ? "true" : "false");
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
      }
      const response = await axios.post("http://localhost:5000/api/tasks", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Task created successfully!");
      setIsCreateDialogOpen(false);
      setTasks((prev) => [response.data.task, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("");
      setNewBudget("");
      setNewDeadline("");
      setContactEmail("");
      setContactPhone("");
      setSelectedFiles([]);
      setAllowMultiple(false);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };
  
  function TaskCard({ task }: { task: Task }) {
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } catch (e) {
        return dateString;
      }
    };
  
    const getTimeAgo = (dateString: string) => {
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return formatDate(dateString);
      } catch (e) {
        return "Recently";
      }
    };
  
    const clientName = task.postedBy?.name || "Client";
    const clientPhoto =
      task.postedBy?.photo && task.postedBy.photo.length > 0
        ? task.postedBy.photo.startsWith("http")
          ? task.postedBy.photo
          : `http://localhost:5000${task.postedBy.photo}`
        : "";
  
    // Check if task.allowMultiple is true then show multiple freelancers icon, otherwise single freelancer icon.
    const freelancerIcon = task.allowMultiple ? (
      <Users className="w-4 h-4" />
    ) : (
      <User className="w-4 h-4" />
    );
  
    return (
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 hover:from-card hover:via-accent/5 hover:to-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <div className="absolute inset-[1px] rounded-lg bg-card" />
  
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                {task.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-3">
                <Avatar className="h-7 w-7 border-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                  {clientPhoto ? (
                    <AvatarImage src={clientPhoto} alt={clientName} />
                  ) : (
                    <AvatarFallback className="text-xs bg-gray-200 text-gray-700 font-semibold">
                      {clientName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{clientName}</span>
                  <span className="text-xs text-muted-foreground">
                    {getTimeAgo(task.createdAt || "")}
                  </span>
                </div>
              </div>
            </div>
            {getStatusBadge(task.status)}
          </div>
        </CardHeader>
  
        <CardContent className="pb-4 relative z-10">
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-4">{task.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Budget</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-300">${task.budget}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Deadline</p>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                  {formatDate(task.deadline)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
  
        <CardFooter className="flex justify-between items-center pt-4 border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10 relative z-10">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="font-medium bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary hover:from-primary/20 hover:to-purple-500/20 border-primary/20"
            >
              {task.category}
            </Badge>
            {task.applicants > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                <Users className="h-3 w-3" />
                <span>{task.applicants}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10 hover:text-primary hover:border-primary/30 transition-all duration-300"
            >
              <Heart className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href={`/task/${task._id || task.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Link>
            </Button>
            <div className="flex items-center" title={task.allowMultiple ? "Multiple freelancers required" : "Single freelancer required"}>
              {freelancerIcon}
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <>
      <CommonHeader />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-slate-950/50 dark:to-purple-950/20">
        <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 dark:from-primary/20 dark:via-purple-500/20 dark:to-pink-500/10 p-8 md:p-12">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-orange-500/20 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-primary">Welcome back!</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Hello, {user?.name || "User"}! 👋
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Discover amazing opportunities and grow your career as a {isClient ? "Client" : "Freelancer"}. Find the perfect {isClient ? "freelancers" : "projects"} to bring your ideas to life.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>{activeTasks} active tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Top rated platform</span>
                  </div>
                </div>
              </div>
              {isClient && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Create New Task
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      Create New Task
                    </DialogTitle>
                    <form onSubmit={handleCreateTask} className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="newTitle" className="text-sm font-medium">
                            Task Title *
                          </Label>
                          <Input id="newTitle" placeholder="Enter a compelling task title" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-2 h-12" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="newDescription" className="text-sm font-medium">
                            Description
                          </Label>
                          <Textarea id="newDescription" placeholder="Describe your task in detail..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-2 min-h-[120px]" />
                        </div>
                        <div>
                          <Label htmlFor="newCategory" className="text-sm font-medium">
                            Category
                          </Label>
                          <Select value={newCategory} onValueChange={setNewCategory}>
                            <SelectTrigger className="h-12 mt-2">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.slice(1).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="newBudget" className="text-sm font-medium">
                            Budget ($) *
                          </Label>
                          <Input id="newBudget" type="number" placeholder="Enter budget" required value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="h-12 mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="newDeadline" className="text-sm font-medium">
                            Deadline
                          </Label>
                          <Input id="newDeadline" type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="h-12 mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="contactEmail" className="text-sm font-medium">
                            Contact Email
                          </Label>
                          <Input id="contactEmail" type="email" placeholder="your@email.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-12 mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="contactPhone" className="text-sm font-medium">
                            Contact Phone
                          </Label>
                          <Input id="contactPhone" type="text" placeholder="Enter phone number" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="h-12 mt-2" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="imageUpload" className="text-sm font-medium">
                            Attach Images
                          </Label>
                          <Input id="imageUpload" type="file" multiple onChange={(e) => handleFilesChange(e)} className="mt-2 h-12" />
                          {selectedFiles.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="relative">
                                  <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-20 object-cover rounded-md" />
                                  <button type="button" onClick={() => removeFile(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Checkbox to allow multiple freelancers */}
                        <div className="md:col-span-2 flex items-center gap-2">
                          <Label htmlFor="allowMultiple" className="text-sm font-medium">
                            Allow multiple freelancers to apply
                          </Label>
                          <input
                            id="allowMultiple"
                            type="checkbox"
                            checked={allowMultiple}
                            onChange={(e) => setAllowMultiple(e.target.checked)}
                            className="h-5 w-5"
                          />
                        </div>
                      </div>
                      {createError && (
                        <div className="p-4 rounded-lg bg-gradient-to-r from-destructive/10 to-red-500/10 border border-destructive/20 text-destructive">
                          {createError}
                        </div>
                      )}
                      <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating} className="px-8 bg-gradient-to-r from-primary to-purple-600">
                          {isCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Task"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
  
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Tasks</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalTasks}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">All available tasks</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-200/50 dark:border-blue-700/50">
                  <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
  
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Active Tasks</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{activeTasks}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Ready to apply</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-700/50">
                  <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </Card>
  
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg Budget</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">${avgBudget}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Per task</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-200/50 dark:border-purple-700/50">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>
  
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/30 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Categories</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{totalCategories}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Different types</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-200/50 dark:border-orange-700/50">
                  <Target className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </Card>
          </div>
  
          {/* Filters Section */}
          <Card className="p-6 bg-gradient-to-r from-card via-card to-muted/20 border-border/50">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search tasks, categories, or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50" />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 h-12 bg-background/50 border-border/50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-12 bg-background/50 border-border/50">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="budgetHigh">Budget: High to Low</SelectItem>
                    <SelectItem value="budgetLow">Budget: Low to High</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-10 w-10 p-0">
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-10 w-10 p-0">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
  
          {isLoadingTasks ? (
            <Card className="p-16 text-center bg-gradient-to-br from-card to-muted/20">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-primary/20"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold">Loading amazing tasks...</p>
                  <p className="text-muted-foreground">Please wait while we fetch the latest opportunities</p>
                </div>
              </div>
            </Card>
          ) : fetchError ? (
            <Card className="p-16 text-center bg-gradient-to-br from-destructive/5 to-red-500/5 border-destructive/20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
                <Calendar className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Oops! Something went wrong</h3>
              <p className="text-muted-foreground">{fetchError}</p>
            </Card>
          ) : filteredTasks.length === 0 ? (
            <Card className="p-16 text-center bg-gradient-to-br from-muted/30 to-muted/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters to find more tasks"
                  : "Be the first to create a task and start building amazing projects!"}
              </p>
              {isClient && (
                <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="bg-gradient-to-r from-primary to-purple-600">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Task
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredTasks.length}</span> of{" "}
                  <span className="font-semibold text-foreground">{totalTasks}</span> tasks
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live updates</span>
                </div>
              </div>
              <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {filteredTasks.map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}