"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Filter,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { TaskCard } from "@/components/TaskCard";

export default function DashboardPage() {
  const router = useRouter();
  // Sidebar and dialog state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Form state for creating a new task
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // User profile state for header
  const [user, setUser] = useState<any>(null);

  // Fetch logged-in user profile
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

  // Fetch tasks from the backend when the component mounts
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

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    const trimmedTitle = newTitle.trim();
    const parsedBudget = parseFloat(newBudget);
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
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("images", selectedFiles[i]);
        }
      }
      const response = await axios.post("http://localhost:5000/api/tasks", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Task created successfully!");
      setIsCreateDialogOpen(false);
      setTasks((prev) => [...prev, response.data.task]);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Helper: Build avatar URL if photo is relative
  const getAvatarUrl = (photo: string) => {
    if (!photo) return "";
    return photo.startsWith("http") ? photo : `http://localhost:5000${photo}`;
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col bg-background border-r border-border p-4 md:flex">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            T
          </div>
          <h1 className="text-xl font-bold">TaskHub</h1>
        </div>
        <nav className="space-y-1 flex-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/tasks">
              <MessageSquare className="mr-2 h-4 w-4" />
              My Tasks
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </nav>
        <div className="mt-auto pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 p-4 border-b">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  T
                </div>
                <h1 className="text-xl font-bold">TaskHub</h1>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/dashboard/tasks">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Tasks
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </nav>
              <div className="mt-auto p-4 border-t">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background flex items-center px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              T
            </div>
          </div>
          <div className="flex-1 flex items-center mx-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search tasks..." className="w-full pl-9 h-9 md:max-w-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
          <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/notifications")}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {user && user.photo ? (
                      <AvatarImage src={user.photo.startsWith("http") ? user.photo : `http://localhost:5000${user.photo}`} alt={user.name} />
                    ) : (
                      <AvatarFallback>{user ? user.name.charAt(0) : "JD"}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden md:inline-block">{user ? user.name : "John Doe"}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user ? user.name : "John Doe"}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              {/* Create Task Button using Dialog for modal form */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md h-[80vh] overflow-y-auto">
                  <DialogTitle>Create New Task</DialogTitle>
                  <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="newTitle">Task Title</Label>
                      <Input
                        id="newTitle"
                        placeholder="Enter task title"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newDescription">Description</Label>
                      <Input
                        id="newDescription"
                        placeholder="Enter task description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newCategory">Category</Label>
                      <Input
                        id="newCategory"
                        placeholder="e.g., Web Development"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newBudget">Budget ($)</Label>
                      <Input
                        id="newBudget"
                        type="number"
                        placeholder="Enter budget"
                        required
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newDeadline">Deadline</Label>
                      <Input
                        id="newDeadline"
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="Enter contact email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="Enter contact phone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="imageFiles">Upload Images</Label>
                      <Input
                        id="imageFiles"
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        className="h-11"
                      />
                    </div>
                    {createError && <p className="text-red-500 text-sm">{createError}</p>}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating Task..." : "Create Task"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="open" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.filter((task) => task.status === "open").map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="in-progress" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.filter((task) => task.status === "in-progress").map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.filter((task) => task.status === "completed").map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
