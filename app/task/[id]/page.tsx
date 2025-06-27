"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
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
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge className="bg-green-500 text-white dark:bg-green-700">Open</Badge>;
    case "in-progress":
      return <Badge className="bg-blue-500 text-white dark:bg-blue-700">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-gray-500 text-white dark:bg-gray-700">Completed</Badge>;
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [popUpMessage, setPopUpMessage] = useState<string | null>(null);

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
      } catch (err: any) {
        console.error("Error fetching task:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch task details");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTask();
  }, [id]);

  // Handle application: include freelancerId in request body.
  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!applicationMessage.trim()) return;
    setIsApplying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${id}/apply`,
        { freelancerId: currentUserId, message: applicationMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTask(response.data.task);
      setPopUpMessage("Application submitted successfully!");
      setApplicationSuccess(true);
      setTimeout(() => {
        setApplicationMessage("");
        setApplicationSuccess(false);
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.message === "You cannot apply for your own task.") {
        setPopUpMessage("You cannot apply for your own task.");
      } else if (err.response?.data?.message === "You have already applied for this task.") {
        setPopUpMessage("You have already applied for this task.");
      } else {
        setPopUpMessage(err.response?.data?.message || "Failed to submit application.");
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
      setPopUpMessage("Link copied to clipboard!");
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center dark:bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-gray-600 dark:text-white">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 dark:bg-black">
        <Alert variant="destructive" className="max-w-2xl mx-auto dark:bg-black dark:border-white">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-lg text-white">{error}</AlertDescription>
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
      <div className="container mx-auto px-4 py-12 text-center dark:bg-black">
        <div className="max-w-2xl mx-auto bg-gray-100 dark:bg-black rounded-lg p-12">
          <AlertCircle className="h-16 w-16 text-gray-400 dark:text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Task Not Found</h2>
          <p className="text-gray-600 dark:text-white mb-6">
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
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-black min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline text-gray-700 dark:text-white">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSaveTask} className="flex items-center gap-1 border-gray-300 dark:border-white">
              <Bookmark className="h-5 w-5 text-gray-700 dark:text-white" />
              <span className="text-gray-700 dark:text-white">{isSaved ? "Saved" : "Save"}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareTask} className="flex items-center gap-1 border-gray-300 dark:border-white">
              <Share2 className="h-5 w-5 text-gray-700 dark:text-white" />
              <span className="text-gray-700 dark:text-white">Share</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section: Task Details and Task Progress */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <Badge variant="outline" className="text-sm font-medium dark:bg-black dark:text-white">
                  {task.category}
                </Badge>
                {getStatusBadge(task.status || "open")}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-800 dark:text-white">
                {task.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-white">
                <div className="flex items-center gap-1">
                  <Calendar className="h-5 w-5" />
                  <span>Posted on {formatDate(task.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  <span>Deadline: {formatDate(task.deadline)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-5 w-5" />
                  <span>{task.applications?.length || 0} applicants</span>
                </div>
              </div>
            </div>

            {/* Tabs for Task Content */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid grid-cols-3 gap-2 mb-6">
                <TabsTrigger value="description" className="px-4 py-2 rounded-md text-gray-700 dark:text-white">
                  Description
                </TabsTrigger>
                <TabsTrigger value="images" className="px-4 py-2 rounded-md text-gray-700 dark:text-white">
                  Images
                </TabsTrigger>
                <TabsTrigger value="details" className="px-4 py-2 rounded-md text-gray-700 dark:text-white">
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-6">
                <Card className="shadow-md dark:bg-black dark:border-white">
                  <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-lg leading-relaxed whitespace-pre-line">
                        {task.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {task.skills && task.skills.length > 0 && (
                  <Card className="shadow-md dark:bg-black dark:border-white">
                    <CardHeader className="px-6 pt-6">
                      <CardTitle className="text-xl text-gray-800 dark:text-white">Required Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="flex flex-wrap gap-3">
                        {task.skills.map((skill: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1 text-sm dark:bg-black dark:text-white border dark:border-white"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="images">
                <Card className="shadow-md overflow-hidden dark:bg-black dark:border-white">
                  <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-xl text-gray-800 dark:text-white">Task Images</CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-white">
                      {task.images && task.images.length > 0
                        ? `${task.images.length} ${task.images.length > 1 ? "images" : "image"} attached`
                        : "No images attached"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-4">
                    {task.images && task.images.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative aspect-video bg-gray-100 dark:bg-black rounded-lg overflow-hidden">
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
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white rounded-full p-2"
                                onClick={prevImage}
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white rounded-full p-2"
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
                                className="absolute bottom-4 right-4 bg-black text-white rounded-md px-3 py-1"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Full Size
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-0 overflow-hidden dark:bg-black">
                              <DialogTitle className="sr-only">Full Size Image</DialogTitle>
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
                                className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                                  index === activeImageIndex
                                    ? "border-primary"
                                    : "border-transparent"
                                }`}
                                onClick={() => setActiveImageIndex(index)}
                              >
                                <img
                                  src={
                                    img.startsWith("http")
                                      ? img
                                      : `http://localhost:5000${img}`
                                  }
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-black rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-white mb-4" />
                        <p className="text-gray-500 dark:text-white">No images have been uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="details" className="space-y-6">
                <Card className="shadow-md dark:bg-black dark:border-white">
                  <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-xl text-gray-800 dark:text-white">Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white">Budget</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-white">${task.budget}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                          <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white">Category</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-white">{task.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white">Deadline</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-white">
                            {formatDate(task.deadline)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white">Posted On</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-white">
                            {formatDate(task.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {task.location && (
                      <div className="flex items-center gap-3 mt-4">
                        <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-white">Location</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-white">{task.location}</p>
                        </div>
                      </div>
                    )}
                    {(task.contactEmail || task.contactPhone) && (
                      <>
                        <Separator className="my-4" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {task.contactEmail && (
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-white">Email</p>
                                <p className="text-lg font-semibold text-gray-800 dark:text-white">{task.contactEmail}</p>
                              </div>
                            </div>
                          )}
                          {task.contactPhone && (
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 dark:bg-black p-2 rounded-md">
                                <Phone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-white">Phone</p>
                                <p className="text-lg font-semibold text-gray-800 dark:text-white">{task.contactPhone}</p>
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

            {/* Task Progress Section */}
            <Card className="shadow-md dark:bg-black dark:border-white">
              <CardHeader className="px-6 py-4 bg-gray-50 dark:bg-black">
                <CardTitle className="text-xl text-gray-800 dark:text-white">Task Progress</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-white">
                    <span>Applications</span>
                    <span className="font-semibold">{task.applications?.length || 0}</span>
                  </div>
                  <Progress value={Math.min((task.applications?.length || 0) * 10, 100)} className="h-2 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-white">
                    <span>Time Remaining</span>
                    <span className="font-semibold">
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
                              ((new Date(task.deadline).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24 * 30)) *
                                100
                            )
                          )
                        : 100
                    }
                    className="h-2 rounded-full"
                  />
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-black p-4 text-sm">
                  <p className="font-semibold mb-1 text-gray-800 dark:text-white">Task Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(task.status || "open")}
                    <span className="text-gray-600 dark:text-white">
                      {task.status === "open"
                        ? "Accepting applications"
                        : task.status === "in-progress"
                        ? "Work in progress"
                        : "Task completed"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Application and Client Info */}
          <aside className="space-y-8">
            {/* Apply for Task */}
            <Card className="shadow-md dark:bg-black dark:border-white">
              <CardHeader className="px-6 py-4 bg-gray-50 dark:bg-black">
                <CardTitle className="text-xl text-gray-800 dark:text-white">Apply for this Task</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-white">
                  Send a message to the client explaining why you're a good fit.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-4">
                {applicationSuccess ? (
                  <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:border-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <AlertDescription>
                      Your application has been submitted successfully!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4">
                    <Textarea
                      placeholder="Write your message here..."
                      className="min-h-[150px] resize-none dark:bg-black dark:text-white border dark:border-white"
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full" disabled={isApplying || !applicationMessage.trim()}>
                      {isApplying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
              <Card className="shadow-md dark:bg-black dark:border-white">
                <CardHeader className="px-6 py-4 bg-gray-50 dark:bg-black">
                  <CardTitle className="text-xl text-gray-800 dark:text-white">About the Client</CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {task.postedBy.photo ? (
                        <AvatarImage
                          src={task.postedBy.photo.startsWith("http")
                            ? task.postedBy.photo
                            : `http://localhost:5000${task.postedBy.photo}`}
                          alt={task.postedBy.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-black dark:text-white">
                          {task.postedBy.name?.charAt(0).toUpperCase() || "C"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{task.postedBy.name || "Client"}</p>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/messages/${task.postedBy._id}?task=${task._id}`}>
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Contact Client
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>

      {/* Popup Message Dialog */}
      {popUpMessage && (
        <Dialog open={true} onOpenChange={() => setPopUpMessage(null)}>
          <DialogContent className="max-w-sm mx-auto p-4 dark:bg-black">
            <DialogTitle className="sr-only">Notification</DialogTitle>
            <div className="text-center">
              <p className="text-lg text-gray-800 dark:text-white">{popUpMessage}</p>
              <Button variant="outline" className="mt-4" onClick={() => setPopUpMessage(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}