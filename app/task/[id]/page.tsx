"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent, useRef } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  User,
  MapPin,
  Phone,
  Mail,
  Share2,
  Bookmark,
  ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge className="bg-green-500 text-white">Open</Badge>;
    case "in-progress":
      return <Badge className="bg-blue-500 text-white">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-gray-500 text-white">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Types
interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  createdAt: string;
  postedBy: {
    _id: string;
    name: string;
    photo: string;
    company?: string;
    createdAt?: string;
    tasksPosted?: number;
  };
  images: string[];
  contactEmail?: string;
  contactPhone?: string;
  skills?: string[];
  applications?: any[];
  location?: string;
  status?: string;
}

export default function TaskDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [similarTasks, setSimilarTasks] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  // Load current user's ID from localStorage after mount.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("userId") || "";
      setCurrentUserId(storedId);
    }
  }, []);

  // Fetch task details
  useEffect(() => {
    if (!id) return;
    async function fetchTask() {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTask(response.data);
        // Simulate similar tasks.
        setSimilarTasks([
          {
            id: "sim1",
            title: "Similar Web Development Project",
            category: response.data.category,
            budget: response.data.budget * 0.9,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "sim2",
            title: "Related Design Task",
            category: response.data.category,
            budget: response.data.budget * 1.1,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } catch (err: any) {
        console.error("Error fetching task:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch task details");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTask();
    const interval = setInterval(fetchTask, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [id]);

  // Handle application: include freelancerId in the request body.
  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!applicationMessage.trim()) return;
    setIsApplying(true);
    try {
      const token = localStorage.getItem("token");
      // Include freelancerId in request body to fix ObjectId casting issue.
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${id}/apply`,
        { freelancerId: currentUserId, message: applicationMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update task details if needed (for example, updating applications count)
      setTask(response.data.task);
      setApplicationSuccess(true);
      // Redirect to chat page if backend creates a new conversation, e.g.,
      if (response.data.conversationId) {
        router.push(`/notifications/chat/${response.data.conversationId}`);
      }
      setTimeout(() => {
        setApplicationMessage("");
        setApplicationSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error applying for task:", JSON.stringify(err.response?.data) || err.message);
      if (err.response?.data?.message === "You have already applied for this task.") {
        alert("You have already applied for this task.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveTask = () => {
    setIsSaved(!isSaved);
  };

  const handleShareTask = () => {
    if (navigator.share) {
      navigator
        .share({
          title: task?.title,
          text: `Check out this task: ${task?.title}`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const nextImage = () => {
    if (!task?.images?.length) return;
    setActiveImageIndex((prev) => (prev + 1) % task.images.length);
  };

  const prevImage = () => {
    if (!task?.images?.length) return;
    setActiveImageIndex((prev) => (prev - 1 + task.images.length) % task.images.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-lg">{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => router.back()} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto bg-muted/30 rounded-lg p-12">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Task Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The task you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.back()} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveTask}>
              <Bookmark className="h-4 w-4 mr-2" />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareTask}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-sm font-medium">
                  {task.category}
                </Badge>
                {getStatusBadge(task.status || "open")}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{task.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Posted on {formatDate(task.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Deadline: {formatDate(task.deadline)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.applications?.length || 0} applicants</span>
                </div>
              </div>
            </div>

            {/* Task Content Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-4">
                <Card className="border-none shadow-md">
                  <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-lg leading-relaxed whitespace-pre-line">{task.description}</p>
                    </div>
                  </CardContent>
                </Card>
                {task.skills && task.skills.length > 0 && (
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl">Required Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {task.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="images">
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl">Task Images</CardTitle>
                    <CardDescription>
                      {task.images && task.images.length > 0
                        ? `${task.images.length} image${task.images.length > 1 ? "s" : ""} attached`
                        : "No images attached"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    {task.images && task.images.length > 0 ? (
                      <div className="space-y-6">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <img
                            src={
                              task.images[activeImageIndex].startsWith("http")
                                ? task.images[activeImageIndex]
                                : `http://localhost:5000${task.images[activeImageIndex]}`
                            }
                            alt={`Task image ${activeImageIndex + 1}`}
                            className="w-full h-full object-contain"
                          />
                          {task.images.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
                                onClick={prevImage}
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
                                onClick={nextImage}
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </>
                          )}
                          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 bg-black/20 hover:bg-black/40 text-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Full Size
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-0 overflow-hidden">
                              <div className="relative w-full h-full">
                                <img
                                  src={
                                    task.images[activeImageIndex].startsWith("http")
                                      ? task.images[activeImageIndex]
                                      : `http://localhost:5000${task.images[activeImageIndex]}`
                                  }
                                  alt={`Task image ${activeImageIndex + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {task.images.length > 1 && (
                          <div className="grid grid-cols-5 gap-2">
                            {task.images.map((img: string, index: number) => (
                              <div
                                key={index}
                                className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${index === activeImageIndex ? "border-primary" : "border-transparent"}`}
                                onClick={() => setActiveImageIndex(index)}
                              >
                                <img
                                  src={img.startsWith("http") ? img : `http://localhost:5000${img}`}
                                  alt={`Task thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No images have been uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Budget</p>
                          <p className="text-lg font-semibold">${task.budget}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Category</p>
                          <p className="text-lg font-semibold">{task.category}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                          <p className="text-lg font-semibold">{formatDate(task.deadline)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Posted On</p>
                          <p className="text-lg font-semibold">{formatDate(task.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    {task.location && (
                      <div className="flex items-start gap-3 mt-4">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Location</p>
                          <p className="text-lg font-semibold">{task.location}</p>
                        </div>
                      </div>
                    )}
                    {(task.contactEmail || task.contactPhone) && (
                      <>
                        <Separator className="my-4" />
                        <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {task.contactEmail && (
                            <div className="flex items-start gap-3">
                              <div className="bg-primary/10 p-2 rounded-md">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="text-lg font-semibold">{task.contactEmail}</p>
                              </div>
                            </div>
                          )}
                          {task.contactPhone && (
                            <div className="flex items-start gap-3">
                              <div className="bg-primary/10 p-2 rounded-md">
                                <Phone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                <p className="text-lg font-semibold">{task.contactPhone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Sidebar: Application & Client Info */}
            <div className="space-y-6">
              {/* Apply for Task */}
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Apply for this Task</CardTitle>
                  <CardDescription>
                    Send a message to the client explaining why you're a good fit
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {applicationSuccess ? (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Your application has been submitted successfully!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form onSubmit={handleApply} className="space-y-4">
                      <Textarea
                        placeholder="Write your message here..."
                        className="min-h-[150px] resize-none"
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        required
                      />
                      <Button type="submit" className="w-full" disabled={isApplying || !applicationMessage.trim()}>
                        {isApplying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* About the Client */}
              {task.postedBy && (
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">About the Client</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {task.postedBy.photo ? (
                          <AvatarImage
                            src={task.postedBy.photo.startsWith("http") ? task.postedBy.photo : `http://localhost:5000${task.postedBy.photo}`}
                            alt={task.postedBy.name}
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {task.postedBy.name ? task.postedBy.name.charAt(0).toUpperCase() : "C"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{task.postedBy.name || "Client"}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.postedBy.company ||
                            "Member since " + formatDate(task.postedBy.createdAt || task.createdAt).split(",")[1]}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tasks Posted</p>
                        <p className="font-medium">{task.postedBy.tasksPosted || "1"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Response Rate</p>
                        <p className="font-medium">95%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg. Response Time</p>
                        <p className="font-medium">2 hours</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Active</p>
                        <p className="font-medium">Today</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/messages/${task.postedBy._id || "new"}?task=${task._id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Client
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Task Progress */}
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Task Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Applications</span>
                        <span className="font-medium">{task.applications?.length || 0}</span>
                      </div>
                      <Progress value={Math.min((task.applications?.length || 0) * 10, 100)} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Time Remaining</span>
                        <span className="font-medium">
                          {task.deadline
                            ? Math.max(0, Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) +
                              " days"
                            : "No deadline"}
                        </span>
                      </div>
                      <Progress
                        value={
                          task.deadline
                            ? Math.max(
                                0,
                                Math.min(
                                  100,
                                  ((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)) * 100
                                )
                              )
                            : 100
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-sm">
                      <p className="font-medium mb-1">Task Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task.status || "open")}
                        <span className="text-muted-foreground">
                          {task.status === "open"
                            ? "Accepting applications"
                            : task.status === "in-progress"
                            ? "Work in progress"
                            : "Task completed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}