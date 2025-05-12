"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import {
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Applicant {
  applicant: {
    _id: string;
    name: string;
    photo?: string;
    email?: string;
  };
  message: string;
  appliedAt: string;
  decision?: string | null; // accepted means assigned, undefined or null means pending.
}

interface Task {
  _id: string;
  title: string;
}

export default function ApplicantsPage() {
  const { id: taskId } = useParams() as { id: string };
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Filter options: "all" for pending (not assigned), and "assigned" for accepted applicants.
  const [filterStatus, setFilterStatus] = useState("all");

  // Load current user's (client's) ID from localStorage.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("userId") || "";
      setCurrentUserId(storedId);
    }
  }, []);

  // Helper function to fetch full user details by applicant ID.
  const fetchApplicantDetails = async (applicantId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/users/${applicantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      console.error("Error fetching applicant details:", error);
      return null;
    }
  };

  // Fetch task details and applicants.
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        // Fetch task details.
        const taskResponse = await axios.get(`http://localhost:5000/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTask(taskResponse.data.task);

        // Fetch list of applicants.
        const response = await axios.get(`http://localhost:5000/api/tasks/${taskId}/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let fetchedApplicants: Applicant[] = response.data.applicants;

        // Ensure each applicant has a photo.
        const updatedApplicants = await Promise.all(
          fetchedApplicants.map(async (app) => {
            if (!app.applicant.photo || app.applicant.photo.trim() === "") {
              const userDetails = await fetchApplicantDetails(app.applicant._id);
              if (userDetails && userDetails.photo) {
                app.applicant.photo = userDetails.photo;
              }
            }
            return app;
          })
        );
        setApplicants(updatedApplicants);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    }
    if (taskId) {
      fetchData();
    }
  }, [taskId]);

  // Helper: Fetch existing conversation between client and freelancer.
  const fetchExistingConversation = async (applicantId: string) => {
    const token = localStorage.getItem("token");
    const resp = await axios.get("http://localhost:5000/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const conv = resp.data.find((c: any) =>
      c.task._id === taskId &&
      c.client._id === currentUserId &&
      c.freelancer._id === applicantId
    );
    return conv;
  };

  // Handle individual applicant action for Accept (assign) or Reject.
  const handleApplicantAction = async (applicantId: string, action: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}/applicants/${applicantId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update state based on action.
      setApplicants((prev) =>
        prev.map((app) =>
          app.applicant._id === applicantId ? { ...app, decision: action === "accept" ? "accepted" : null } : app
        )
      );
      alert("Applicant decision updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update applicant decision");
    }
  };

  // Handle Chat button click.
  const handleChatInitiation = async (applicantId: string) => {
    const token = localStorage.getItem("token");
    try {
      const payload = {
        taskId,
        freelancerId: applicantId,
        clientId: currentUserId,
        message: "",
      };
      const response = await axios.post(
        `http://localhost:5000/api/conversations`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const conversation = response.data;
      router.push(`/notifications/chat/${conversation._id}`);
    } catch (err: any) {
      // If conversation already exists, navigate to it.
      if (
        err.response?.status === 400 &&
        err.response.data.message === "You have already applied for this task."
      ) {
        try {
          const existingConv = await fetchExistingConversation(applicantId);
          if (existingConv) {
            router.push(`/notifications/chat/${existingConv._id}`);
            return;
          } else {
            const newResponse = await axios.post(
              `http://localhost:5000/api/conversations`,
              {
                taskId,
                freelancerId: applicantId,
                clientId: currentUserId,
                message: "",
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            router.push(`/notifications/chat/${newResponse.data._id}`);
          }
        } catch (fetchErr: any) {
          alert(
            fetchErr.response?.data?.message ||
              "Failed to retrieve or create conversation"
          );
          return;
        }
      } else {
        alert(err.response?.data?.message || "Failed to initiate chat");
      }
    }
  };

  // Navigate to applicant profile page.
  const handleProfileView = (applicantId: string) => {
    // Redirect client to the applicant's profile page at /dashboard/profile/[id]
    router.push(`/dashboard/profile/${applicantId}`);
  };

  // Handlers for search and filter controls.
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  };

  // Determine display status. "accepted" means assigned; pending means not assigned.
  const getDisplayStatus = (app: Applicant) => {
    return app.decision === "accepted" ? "assigned" : "pending";
  };

  // Compute filtered applicant list based on search term and filter status.
  const filteredApplicants = applicants.filter((app) => {
    const status = getDisplayStatus(app);
    const matchesSearch = app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === "assigned") {
      return matchesSearch && status === "assigned";
    }
    // "all" filter shows all pending applicants.
    return matchesSearch && status === "pending";
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container max-w-screen-xl py-6 px-4 md:px-6 space-y-6">
      <h1 className="text-3xl font-bold">
        {task ? `Applicants for "${task.title}"` : "Applicants"}
      </h1>

      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Input
          placeholder="Search applicants..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <select
          value={filterStatus}
          onChange={handleFilterStatusChange}
          className="border rounded px-2 py-1"
          aria-label="Filter applicants by status"
          title="Filter applicants by status"
        >
          <option value="pending">All (Pending)</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {filteredApplicants.length === 0 ? (
        <p>No applicants found.</p>
      ) : (
        <div className="space-y-4">
          {filteredApplicants.map((app) => {
            const status = getDisplayStatus(app);
            // Visual feedback: green border for assigned and default for pending.
            const cardBorder = status === "assigned" ? "border-green-500" : "";
            return (
              <Card
                key={`${app.applicant._id}-${app.appliedAt}`}
                className={`flex flex-col md:flex-row items-center justify-between p-4 ${cardBorder}`}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-8 w-8 mr-1 self-end mb-1">
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
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {app.applicant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p 
                      className="font-medium cursor-pointer hover:underline" 
                      onClick={() => handleProfileView(app.applicant._id)}
                    >
                      {app.applicant.name}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {app.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied at: {new Date(app.appliedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedApplicant(app)}
                  >
                    View Message
                  </Button>
                  {status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleApplicantAction(app.applicant._id, "accept")
                        }
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleApplicantAction(app.applicant._id, "decline")
                        }
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChatInitiation(app.applicant._id)}
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Chat
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {selectedApplicant && (
        <Dialog open={true} onOpenChange={() => setSelectedApplicant(null)}>
          <DialogContent>
            <DialogTitle>{selectedApplicant.applicant.name}&apos;s Application</DialogTitle>
            <div className="mt-4">
              <Input readOnly value={selectedApplicant.message} className="w-full" />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedApplicant(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div>
        <Button onClick={() => router.back()}>Back to Task</Button>
      </div>
    </div>
  );
}