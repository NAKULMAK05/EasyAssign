"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, type ChangeEvent } from "react"
import axios from "axios"
import {
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  User,
  Clock,
  Filter,
  ArrowLeft,
  Star,
  Calendar,
  Mail,
  Briefcase,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Eye,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Applicant {
  applicant: {
    _id: string
    name: string
    photo?: string
    email?: string
    skills?: string[]
    rating?: number
    location?: string
    experience?: string
  }
  message: string
  appliedAt: string
  decision?: string | null // accepted means assigned, undefined or null means pending.
}

interface Task {
  _id: string
  title: string
  description?: string
  budget?: number | string
  deadline?: string
  category?: string
}

export default function ApplicantsPage() {
  const { id: taskId } = useParams() as { id: string }
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [currentUserId, setCurrentUserId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [messageToSend, setMessageToSend] = useState("")
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  // Load current user's (client's) ID from localStorage.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("userId") || ""
      setCurrentUserId(storedId)
    }
  }, [])

  // Helper function to fetch full user details by applicant ID.
  const fetchApplicantDetails = async (applicantId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`http://localhost:5000/api/users/${applicantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data
    } catch (error) {
      console.error("Error fetching applicant details:", error)
      return null
    }
  }

  // Fetch task details and applicants.
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        // Fetch task details.
        const taskResponse = await axios.get(`http://localhost:5000/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTask(taskResponse.data.task)

        // Fetch list of applicants.
        const response = await axios.get(`http://localhost:5000/api/tasks/${taskId}/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const fetchedApplicants: Applicant[] = response.data.applicants

        // Ensure each applicant has a photo.
        const updatedApplicants = await Promise.all(
          fetchedApplicants.map(async (app) => {
            if (!app.applicant.photo || app.applicant.photo.trim() === "") {
              const userDetails = await fetchApplicantDetails(app.applicant._id)
              if (userDetails && userDetails.photo) {
                app.applicant.photo = userDetails.photo
              }
            }
            // Add mock data for demo purposes
            app.applicant.skills = app.applicant.skills || ["React", "Node.js", "UI/UX Design"]
            app.applicant.rating = app.applicant.rating || Math.floor(Math.random() * 2) + 4 // 4 or 5
            app.applicant.location = app.applicant.location || "New York, USA"
            app.applicant.experience = app.applicant.experience || "3+ years"
            return app
          }),
        )
        setApplicants(updatedApplicants)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }
    if (taskId) {
      fetchData()
    }
  }, [taskId])

  // Helper: Fetch existing conversation between client and freelancer.
  const fetchExistingConversation = async (applicantId: string) => {
    const token = localStorage.getItem("token")
    const resp = await axios.get("http://localhost:5000/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const conv = resp.data.find(
      (c: any) => c.task._id === taskId && c.client._id === currentUserId && c.freelancer._id === applicantId,
    )
    return conv
  }

  // Handle individual applicant action for Accept (assign) or Reject.
  const handleApplicantAction = async (applicantId: string, action: string) => {
    try {
      if (action === "accept") {
        setIsAccepting(true)
      } else {
        setIsRejecting(true)
      }

      const token = localStorage.getItem("token")
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}/applicants/${applicantId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update state based on action.
      setApplicants((prev) =>
        prev.map((app) =>
          app.applicant._id === applicantId ? { ...app, decision: action === "accept" ? "accepted" : null } : app,
        ),
      )

      // Show success message
      if (action === "accept") {
        alert("Applicant accepted successfully!")
      } else {
        alert("Applicant rejected successfully!")
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} applicant`)
    } finally {
      setIsAccepting(false)
      setIsRejecting(false)
    }
  }

  // Handle Chat button click.
  const handleChatInitiation = async (applicantId: string) => {
    setIsChatting(true)
    const token = localStorage.getItem("token")
    try {
      const payload = {
        taskId,
        freelancerId: applicantId,
        clientId: currentUserId,
        message: messageToSend || "",
      }
      const response = await axios.post(`http://localhost:5000/api/conversations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const conversation = response.data
      setIsChatting(false)
      setIsMessageDialogOpen(false)
      router.push(`/notifications/chat/${conversation._id}`)
    } catch (err: any) {
      // If conversation already exists, navigate to it.
      if (err.response?.status === 400 && err.response.data.message === "You have already applied for this task.") {
        try {
          const existingConv = await fetchExistingConversation(applicantId)
          if (existingConv) {
            setIsChatting(false)
            setIsMessageDialogOpen(false)
            router.push(`/notifications/chat/${existingConv._id}`)
            return
          } else {
            const newResponse = await axios.post(
              `http://localhost:5000/api/conversations`,
              {
                taskId,
                freelancerId: applicantId,
                clientId: currentUserId,
                message: messageToSend || "",
              },
              { headers: { Authorization: `Bearer ${token}` } },
            )
            setIsChatting(false)
            setIsMessageDialogOpen(false)
            router.push(`/notifications/chat/${newResponse.data._id}`)
          }
        } catch (fetchErr: any) {
          setIsChatting(false)
          alert(fetchErr.response?.data?.message || "Failed to retrieve or create conversation")
          return
        }
      } else {
        setIsChatting(false)
        alert(err.response?.data?.message || "Failed to initiate chat")
      }
    }
  }

  // Navigate to applicant profile page.
  const handleProfileView = (applicantId: string) => {
    router.push(`/dashboard/profile/${applicantId}`)
  }

  // Handlers for search and filter controls.
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Determine display status. "accepted" means assigned; pending means not assigned.
  const getDisplayStatus = (app: Applicant) => {
    return app.decision === "accepted" ? "assigned" : "pending"
  }

  // Compute filtered applicant list based on search term and active tab.
  const getFilteredApplicants = (status: string) => {
    return applicants.filter((app) => {
      const appStatus = getDisplayStatus(app)
      const matchesSearch = app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase())

      if (status === "assigned") {
        return matchesSearch && appStatus === "assigned"
      } else if (status === "pending") {
        return matchesSearch && appStatus === "pending"
      }
      // "all" filter shows all applicants.
      return matchesSearch
    })
  }

  // Count applicants by status
  const pendingCount = applicants.filter((app) => getDisplayStatus(app) === "pending").length
  const assignedCount = applicants.filter((app) => getDisplayStatus(app) === "assigned").length

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Applicant Card Component
  const ApplicantCard = ({ app }: { app: Applicant }) => {
    const status = getDisplayStatus(app)
    const isAssigned = status === "assigned"

    return (
      <Card
        className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
          isAssigned
            ? "bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30"
            : "bg-gradient-to-br from-card to-muted/20 border-border/50"
        }`}
      >
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              className={`h-12 w-12 border-2 ${isAssigned ? "border-emerald-500/50" : "border-primary/20"} shadow-md`}
            >
              {app.applicant.photo && app.applicant.photo.trim() !== "" ? (
                <AvatarImage
                  src={
                    app.applicant.photo.startsWith("http")
                      ? app.applicant.photo
                      : `http://localhost:5000${app.applicant.photo}`
                  }
                  alt={app.applicant.name}
                />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {app.applicant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3
                className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleProfileView(app.applicant._id)}
              >
                {app.applicant.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{app.applicant.location}</span>
              </div>
            </div>
          </div>
          {isAssigned ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Assigned
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-background">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Pending
            </Badge>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {app.applicant.skills?.map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-muted/50">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {Array.from({ length: app.applicant.rating || 0 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              {Array.from({ length: 5 - (app.applicant.rating || 0) }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-muted" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{app.applicant.rating}/5</span>
          </div>

          <div className="bg-muted/30 p-3 rounded-lg mb-3">
            <p className="text-sm text-muted-foreground italic line-clamp-2">"{app.message}"</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{app.applicant.experience}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Applied {formatDate(app.appliedAt)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 pt-3 border-t bg-muted/20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setSelectedApplicant(app)} className="h-9">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </TooltipTrigger>
              <TooltipContent>View full application details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isAssigned && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApplicantAction(app.applicant._id, "accept")}
                      disabled={isAccepting}
                      className="h-9 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isAccepting ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4 mr-1" />
                      )}
                      Accept
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Assign this task to the applicant</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplicantAction(app.applicant._id, "decline")}
                      disabled={isRejecting}
                      className="h-9 text-destructive hover:bg-destructive/10"
                    >
                      {isRejecting ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reject this applicant</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isAssigned ? "default" : "outline"}
                  onClick={() => {
                    setSelectedApplicant(app)
                    setIsMessageDialogOpen(true)
                  }}
                  className="h-9"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send a message to this applicant</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-muted/20">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground">Loading applicants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container max-w-screen-xl py-8 px-4 md:px-6 space-y-8 bg-gradient-to-br from-background to-muted/20">
      {/* Back Button and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/tasks")}
            className="h-10 w-10 rounded-full bg-background shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Tasks</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Applicants
            </h1>
            <p className="text-muted-foreground">
              {task ? `Manage applicants for "${task.title}"` : "Manage your task applicants"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm py-1.5 px-3 bg-background">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {pendingCount} pending
          </Badge>
          <Badge variant="outline" className="text-sm py-1.5 px-3 bg-background">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {assignedCount} assigned
          </Badge>
        </div>
      </div>

      {/* Task Summary Card */}
      {task && (
        <Card className="bg-gradient-to-r from-card to-muted/20 border-border/50 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{task.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {task.budget && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">${task.budget}</p>
                  </div>
                </div>
              )}
              {task.deadline && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <p className="font-medium">{formatDate(task.deadline)}</p>
                  </div>
                </div>
              )}
              {task.category && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{task.category}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[320px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 bg-background/80 border-border/50"
          />
        </div>
      </div>

      {/* Tabs for Applicants */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
            <Badge variant="secondary" className="ml-1">
              {pendingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Assigned</span>
            <Badge variant="secondary" className="ml-1">
              {assignedCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>All</span>
            <Badge variant="secondary" className="ml-1">
              {applicants.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {getFilteredApplicants("pending").length === 0 ? (
            <Card className="bg-muted/30 border-dashed border-muted-foreground/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No pending applicants</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm
                    ? "Try adjusting your search to find more applicants."
                    : "You don't have any pending applicants at the moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getFilteredApplicants("pending").map((app) => (
                <ApplicantCard key={`${app.applicant._id}-${app.appliedAt}`} app={app} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned" className="mt-6">
          {getFilteredApplicants("assigned").length === 0 ? (
            <Card className="bg-muted/30 border-dashed border-muted-foreground/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No assigned applicants</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm
                    ? "Try adjusting your search to find more applicants."
                    : "You haven't assigned this task to anyone yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getFilteredApplicants("assigned").map((app) => (
                <ApplicantCard key={`${app.applicant._id}-${app.appliedAt}`} app={app} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {getFilteredApplicants("all").length === 0 ? (
            <Card className="bg-muted/30 border-dashed border-muted-foreground/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No applicants found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm
                    ? "Try adjusting your search to find more applicants."
                    : "There are no applicants for this task yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getFilteredApplicants("all").map((app) => (
                <ApplicantCard key={`${app.applicant._id}-${app.appliedAt}`} app={app} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Applicant Details Dialog */}
      {selectedApplicant && (
        <Dialog open={!!selectedApplicant && !isMessageDialogOpen} onOpenChange={() => setSelectedApplicant(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Applicant Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Applicant Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  {selectedApplicant.applicant.photo && selectedApplicant.applicant.photo.trim() !== "" ? (
                    <AvatarImage
                      src={
                        selectedApplicant.applicant.photo.startsWith("http")
                          ? selectedApplicant.applicant.photo
                          : `http://localhost:5000${selectedApplicant.applicant.photo}`
                      }
                      alt={selectedApplicant.applicant.name}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                      {selectedApplicant.applicant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedApplicant.applicant.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedApplicant.applicant.location}</span>
                  </div>
                  <div className="flex mt-1">
                    {Array.from({ length: selectedApplicant.applicant.rating || 0 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                {selectedApplicant.applicant.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedApplicant.applicant.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p>{selectedApplicant.applicant.experience}</p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.applicant.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Application Message */}
              <div>
                <h3 className="text-lg font-medium mb-2">Application Message</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="italic">{selectedApplicant.message}</p>
                </div>
              </div>

              {/* Application Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Applied on</p>
                    <p>{formatDate(selectedApplicant.appliedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p>
                      {getDisplayStatus(selectedApplicant) === "assigned" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Assigned</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Pending</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedApplicant(null)
                    handleProfileView(selectedApplicant.applicant._id)
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
              </div>

              <div className="flex gap-2">
                {getDisplayStatus(selectedApplicant) !== "assigned" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        handleApplicantAction(selectedApplicant.applicant._id, "decline")
                        setSelectedApplicant(null)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        handleApplicantAction(selectedApplicant.applicant._id, "accept")
                        setSelectedApplicant(null)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => {
                    setIsMessageDialogOpen(true)
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Dialog */}
      {selectedApplicant && (
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Message {selectedApplicant.applicant.name}</DialogTitle>
              <DialogDescription>Send a message to start a conversation</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Type your message here..."
                value={messageToSend}
                onChange={(e) => setMessageToSend(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleChatInitiation(selectedApplicant.applicant._id)} disabled={isChatting}>
                {isChatting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <Button
          onClick={() => router.push("/dashboard/tasks")}
          variant="outline"
          className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>
    </div>
  )
}
