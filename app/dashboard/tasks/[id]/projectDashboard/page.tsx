"use client"

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  Loader2,
  Plus,
  Edit,
  CheckCircle,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Clock,
  Target,
  TrendingUp,
  Send,
  Paperclip,
  MoreHorizontal,
  Search,
  Download,
  Upload,
  Eye,
  CheckCircle2,
  Circle,
  PlayCircle,
  GripVertical,
  SortAsc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useTheme } from "next-themes";
import CommonHeader from "@/components/CommonHeader";

interface Milestone {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  updatedAt?: string;
  completedBy?: {
    _id: string;
    name: string;
    photo?: string;
  } | null;
  completedAt?: string | null;
  assignedTo?: string[];
  priority: "low" | "medium" | "high";
  order?: number;
}

interface CrewMember {
  _id: string;
  name: string;
  photo?: string;
  role?: string;
  status: "online" | "offline" | "busy";
  skills: string[];
  completedTasks: number;
  rating: number;
}

interface ProjectActivity {
  _id?: string;
  message: string;
  createdAt: string;
  author: { _id: string; name: string; photo?: string };
  type: "milestone" | "comment" | "file" | "system";
}

interface Comment {
  _id: string;
  message: string;
  author: { _id: string; name: string; photo?: string };
  createdAt: string;
  replies?: Comment[];
}

interface ProjectFile {
  _id: string;
  name: string;
  size: number;
  uploadedBy: { _id: string; name: string; photo?: string };
  uploadedAt: string;
  type: string;
  url: string;
}

interface ProjectDashboardData {
  milestones: Milestone[];
  crewMembers: CrewMember[];
  activities: ProjectActivity[];
  comments: Comment[];
  files: ProjectFile[];
  projectInfo: {
    title: string;
    description: string;
    budget: number;
    deadline: string;
    status: string;
    progress: number;
  };
}

export default function ProjectDashboard() {
  const { id: taskId } = useParams() as { id: string };
  const router = useRouter();
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  // Form states for adding new milestone
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState<string>("");
  const [newMilestoneDue, setNewMilestoneDue] = useState<string>("");
  const [newMilestonePriority, setNewMilestonePriority] = useState<"low" | "medium" | "high">("medium");
  const [isAddingMilestone, setIsAddingMilestone] = useState<boolean>(false);

  // State for inline milestone editing
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [updateTitle, setUpdateTitle] = useState<string>("");
  const [updateDescription, setUpdateDescription] = useState<string>("");
  const [updateDueDate, setUpdateDueDate] = useState<string>("");
  const [updatePriority, setUpdatePriority] = useState<"low" | "medium" | "high">("medium");

  // Chat states
  const [newMessage, setNewMessage] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Filter & drag-and-drop states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const backendUrl = "http://localhost:5000";

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${backendUrl}/api/tasks/${taskId}/projectDashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data.dashboard);
      setMilestones(res.data.dashboard.milestones);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load project dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) fetchDashboard();
  }, [taskId]);

  const handleAddMilestone = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingMilestone(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${backendUrl}/api/tasks/${taskId}/milestones`,
        {
          title: newMilestoneTitle,
          description: newMilestoneDesc,
          dueDate: newMilestoneDue,
          priority: newMilestonePriority,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refetch dashboard to get updated data.
      fetchDashboard();
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
      setNewMilestoneDue("");
      setNewMilestonePriority("medium");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add milestone");
    } finally {
      setIsAddingMilestone(false);
    }
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${backendUrl}/api/tasks/${taskId}/comments`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // New function to mark a milestone as complete
  const handleMarkComplete = async (milestone: Milestone) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${backendUrl}/api/tasks/${taskId}/milestones/${milestone._id}`,
        {
          status: "completed",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state by mapping each milestone and explicitly cast to Milestone.
      const updatedMilestones = milestones.map((m) => {
        if (m._id === milestone._id) {
          return { ...m, status: "completed", completedAt: new Date().toISOString() } as Milestone;
        }
        return m;
      });
      setMilestones(updatedMilestones);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to mark milestone as complete");
    }
  };

  const calculatePriority = (index: number, total: number): "high" | "medium" | "low" => {
    const ratio = index / (total - 1 || 1);
    if (ratio <= 0.33) return "high";
    if (ratio <= 0.66) return "medium";
    return "low";
  };

  const updateMilestonesOrder = async (newOrder: Milestone[]) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: No token provided. Please log in.");
      return;
    }
    const payload = newOrder.map((milestone, index) => ({
      _id: milestone._id,
      priority: calculatePriority(index, newOrder.length),
      order: index,
    }));
    console.log("Updating order with payload:", payload);
    await axios.patch(
      `${backendUrl}/api/tasks/${taskId}/milestones/order`,
      { milestones: payload },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const handleReorderMilestones = async (newOrder: Milestone[]) => {
    setMilestones(newOrder);
    try {
      await updateMilestonesOrder(newOrder);
      setMilestones(
        newOrder.map((milestone, index) => ({
          ...milestone,
          priority: calculatePriority(index, newOrder.length),
          order: index,
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update milestone order");
    }
  };

  const handleStartEditing = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setUpdateTitle(milestone.title);
    setUpdateDescription(milestone.description || "");
    setUpdateDueDate(milestone.dueDate);
    setUpdatePriority(milestone.priority);
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${backendUrl}/api/tasks/${taskId}/milestones/${editingMilestone._id}`,
        {
          title: updateTitle,
          description: updateDescription,
          dueDate: updateDueDate,
          priority: updatePriority,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMilestones((prev) =>
        prev.map((m) =>
          m._id === editingMilestone._id
            ? { ...m, title: updateTitle, description: updateDescription, dueDate: updateDueDate, priority: updatePriority }
            : m
        )
      );
      setEditingMilestone(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update milestone");
    }
  };

  const cancelEditing = () => {
    setEditingMilestone(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const pendingMilestones = milestones.filter((m) => m.status !== "completed");
  const completedMilestones = milestones.filter((m) => m.status === "completed");
  const filteredMilestones = milestones.filter((milestone) =>
    milestone.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedMilestones = [...filteredMilestones].sort((a, b) => {
    switch (sortBy) {
      case "priority": {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      case "dueDate":
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
        <p className="mt-4 text-lg font-medium text-foreground">Loading project dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalProgress = milestones.length > 0 ? (completedMilestones.length / milestones.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommonHeader />
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted rounded-md overflow-auto">
            <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2">
              <Target className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="milestones" className="whitespace-nowrap px-3 py-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="whitespace-nowrap px-3 py-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="team" className="whitespace-nowrap px-3 py-2">
              <Users className="w-4 h-4 mr-2" />
              Crew Members
            </TabsTrigger>
            <TabsTrigger value="files" className="whitespace-nowrap px-3 py-2">
              <FileText className="w-4 h-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Overall Progress</p>
                      <p className="text-2xl font-bold">{Math.round(totalProgress)}%</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <Progress value={totalProgress} className="mt-3" />
                </CardContent>
              </Card>
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Milestones</p>
                      <p className="text-2xl font-bold">{milestones.length}</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Crew Members</p>
                      <p className="text-2xl font-bold">{dashboardData?.crewMembers?.length || 0}</p>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Active Tasks</p>
                      <p className="text-2xl font-bold">
                        {milestones.filter((m) => m.status === "in-progress").length}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Recently Completed Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {completedMilestones.length > 0 ? (
                      completedMilestones.slice(0, 5).map((milestone, index) => (
                        <motion.div
                          key={milestone._id + "-" + index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                        >
                          <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm text-green-800 dark:text-green-200">
                                {milestone.title}
                              </h4>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-300 mb-2 line-clamp-2">
                              {milestone.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                              <div className="flex items-center space-x-2">
                                {milestone.completedBy && (
                                  <div className="flex items-center space-x-1">
                                    <Avatar className="w-4 h-4">
                                      <AvatarImage
                                        src={
                                          milestone.completedBy?.photo && !milestone.completedBy.photo.startsWith("http")
                                            ? `http://localhost:5000${milestone.completedBy.photo}`
                                            : milestone.completedBy?.photo || "/placeholder.svg"
                                        }
                                        alt={milestone.completedBy?.name || "Completed By"}
                                      />
                                      <AvatarFallback className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs">
                                        {milestone.completedBy?.name?.charAt(0) || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>by {milestone.completedBy?.name || "Unknown"}</span>
                                  </div>
                                )}
                              </div>
                              <span>
                                {milestone.completedAt
                                  ? new Date(milestone.completedAt).toLocaleDateString()
                                  : new Date(milestone.updatedAt || "").toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No completed milestones yet</p>
                        <p className="text-muted-foreground text-xs">Completed milestones will appear here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              {completedMilestones.length > 5 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("milestones")}>
                    View All Completed Milestones
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Milestone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMilestone} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        placeholder="Enter milestone title"
                        className="bg-background border"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newMilestoneDue}
                        onChange={(e) => setNewMilestoneDue(e.target.value)}
                        className="bg-background border"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMilestoneDesc}
                      onChange={(e) => setNewMilestoneDesc(e.target.value)}
                      placeholder="Enter milestone description"
                      className="bg-background border"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newMilestonePriority} onValueChange={(value: "low" | "medium" | "high") => setNewMilestonePriority(value)}>
                      <SelectTrigger className="bg-background border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={isAddingMilestone}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isAddingMilestone ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Milestone
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search pending milestones…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-background border">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-sm">
                {pendingMilestones.length} Pending Tasks
              </Badge>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <GripVertical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Drag and drop to reorder milestones.
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pending Milestones</h3>
                <Badge variant="secondary">{pendingMilestones.length} tasks</Badge>
              </div>
              {pendingMilestones.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={pendingMilestones}
                  onReorder={handleReorderMilestones}
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {pendingMilestones
                      .filter((milestone) => milestone.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((milestone, index) => (
                        <Reorder.Item
                          key={milestone._id + "-" + index}
                          value={milestone}
                          onDragStart={() => setIsDragging(true)}
                          onDragEnd={() => setIsDragging(false)}
                          className={`cursor-grab active:cursor-grabbing ${isDragging ? "z-10" : ""}`}
                        >
                          {editingMilestone && editingMilestone._id === milestone._id ? (
                            <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="mb-4">
                                <Label htmlFor="updateTitle" className="mb-1 text-sm">Title</Label>
                                <Input
                                  id="updateTitle"
                                  value={updateTitle}
                                  onChange={(e) => setUpdateTitle(e.target.value)}
                                />
                              </div>
                              <div className="mb-4">
                                <Label htmlFor="updateDueDate" className="mb-1 text-sm">Due Date</Label>
                                <Input
                                  id="updateDueDate"
                                  type="date"
                                  value={updateDueDate}
                                  onChange={(e) => setUpdateDueDate(e.target.value)}
                                />
                              </div>
                              <div className="mb-4">
                                <Label htmlFor="updateDescription" className="mb-1 text-sm">Description</Label>
                                <Textarea
                                  id="updateDescription"
                                  value={updateDescription}
                                  onChange={(e) => setUpdateDescription(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button onClick={handleUpdateMilestone} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                  Save
                                </Button>
                                <Button onClick={cancelEditing} variant="outline">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              whileHover={{ scale: 1.02 }}
                              whileDrag={{ scale: 1.05, rotate: 2 }}
                              className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    {getStatusIcon(milestone.status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h3 className="font-semibold text-lg">{milestone.title}</h3>
                                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(milestone.priority)}`} />
                                    </div>
                                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                      {milestone.description}
                                    </p>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(milestone.dueDate).toLocaleDateString()}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={
                                          milestone.status === "in-progress"
                                            ? "border-blue-600 text-blue-600"
                                            : "border-muted-foreground text-muted-foreground"
                                        }
                                      >
                                        {milestone.status.replace("-", " ").toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleStartEditing(milestone)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => handleMarkComplete(milestone)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" /> Complete
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Reorder.Item>
                      ))}
                  </AnimatePresence>
                </Reorder.Group>
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Pending Milestones</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Great job! All milestones are completed or create your first one above.
                  </p>
                  <Button onClick={() => document.getElementById("title")?.focus()} variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Create First Milestone
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-card border h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Team Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        {dashboardData?.comments?.map((comment, index) => (
                          <motion.div
                            key={comment._id + "-" + index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start space-x-3"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.author?.photo || "/placeholder.svg"} />
                              <AvatarFallback className="bg-muted">
                                {comment.author?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-muted rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">
                                    {comment.author?.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.message}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter>
                    <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-background border"
                      />
                      <Button type="button" variant="outline" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSendingMessage}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </div>
              <div>
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Crew Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.crewMembers?.map((member, index) => (
                        <div key={member._id + "-" + index} className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={
                                member.photo && !member.photo.startsWith("http")
                                  ? `http://localhost:5000${member.photo}`
                                  : member.photo || "/placeholder.svg"
                              }
                              alt={member.name}
                            />
                            <AvatarFallback className="bg-muted">
                              {member.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm">{member.name}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData?.crewMembers?.map((member, index) => (
                <Card key={member._id + "-" + index} className="bg-card border">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={
                            member.photo && !member.photo.startsWith("http")
                              ? `http://localhost:5000${member.photo}`
                              : member.photo || "/placeholder.svg"
                          }
                          alt={member.name}
                        />
                        <AvatarFallback className="bg-muted">
                          {member.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed Tasks</span>
                        <span>{member.completedTasks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant="outline"
                          className={
                            member.status === "online"
                              ? "border-green-600 text-green-600"
                              : member.status === "busy"
                              ? "border-yellow-600 text-yellow-600"
                              : "border-muted-foreground text-muted-foreground"
                          }
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Skills</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.skills?.map((skill, idx) => (
                            <Badge key={skill + "-" + idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Project Files</h2>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 sm:mt-0">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.files?.map((file) => (
                <Card key={file._id} className="bg-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="text-xs text-muted-foreground">
                          by {file.uploadedBy.name} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex space-x-2 w-full">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysRemaining(deadline: string) {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "in-progress":
      return <PlayCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    default:
      return "bg-green-500";
  }
}