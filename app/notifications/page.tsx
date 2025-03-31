"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Bell,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Pin,
  MoreVertical,
  Trash2,
  Archive,
  BellOff,
  Link,
  AlertCircle,
  Filter,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Conversation {
  _id: string;
  participants: { _id: string; name: string; photo: string }[];
  messages: { _id: string; text: string; sender: string; timestamp: string }[];
  task?: {
    _id: string;
    title: string;
    status?: string;
  };
  unreadCount?: number;
  lastActivity?: string;
  pinned?: boolean;
}

export default function NotificationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  // Set currentUserId on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("userId") || "user123"); // fallback for demo
    }
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Enhance data for demo purposes
        const enhancedData = response.data.map((conv: Conversation) => ({
          ...conv,
          unreadCount: Math.floor(Math.random() * 5),
          lastActivity: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          pinned: Math.random() > 0.8,
        }));
        // Sort by pinned first, then by last activity
        enhancedData.sort((a: Conversation, b: Conversation) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.lastActivity || "").getTime() - new Date(a.lastActivity || "").getTime();
        });
        setConversations(enhancedData);
        setFilteredConversations(enhancedData);
      } catch (err: any) {
        console.error("Error fetching conversations:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    }
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  // Helper: Filter conversations based on search query and filter type
  useEffect(() => {
    let filtered = [...conversations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const taskMatch = conv.task?.title.toLowerCase().includes(query);
        const messageMatch = conv.messages.some((msg) => msg.text.toLowerCase().includes(query));
        const participantMatch = conv.participants.some((p) => p.name.toLowerCase().includes(query));
        return taskMatch || messageMatch || participantMatch;
      });
    }

    if (filterType !== "all") {
      if (filterType === "unread") {
        filtered = filtered.filter((conv) => (conv.unreadCount || 0) > 0);
      } else if (filterType === "pinned") {
        filtered = filtered.filter((conv) => conv.pinned);
      } else if (filterType === "completed") {
        filtered = filtered.filter((conv) => conv.task?.status === "completed");
      } else if (filterType === "in-progress") {
        filtered = filtered.filter((conv) => conv.task?.status === "in-progress");
      }
    }

    setFilteredConversations(filtered);
  }, [searchQuery, filterType, conversations]);

  // Helper to format last activity
  const formatLastActivity = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Helper to get the other participant from conversation
  const getOtherParticipant = (conv: Conversation) => {
    if (!conv.participants) return null;
    return conv.participants.find((p) => p._id !== currentUserId);
  };

  // Helper to get last message text with sender name
  function getLastMessage(conv: Conversation) {
    if (!conv.messages || conv.messages.length === 0) return "No messages yet";
    const lastMessage = conv.messages[conv.messages.length - 1];
    let sender = "User";
    if (conv.participants && conv.participants.length > 0) {
      sender =
        lastMessage.sender === currentUserId
          ? "You"
          : conv.participants.find((p) => p._id === lastMessage.sender)?.name || "User";
    }
    return `${sender}: ${lastMessage.text}`;
  }
  
  // Dummy handlers for conversation actions (pin, mute, archive, delete)
  const handlePinConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConversations((prev) =>
      prev.map((conv) => (conv._id === id ? { ...conv, pinned: !conv.pinned } : conv))
    );
  };

  const handleDeleteConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConversations((prev) => prev.filter((conv) => conv._id !== id));
  };

  const handleArchiveConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConversations((prev) => prev.filter((conv) => conv._id !== id));
  };

  const handleMuteConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    alert(`Conversation ${id} muted`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm py-4 px-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back to Dashboard</span>
                </Link>
              </Button>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Messages
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Messages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterType("all")}>All Messages</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("unread")}>Unread</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("pinned")}>Pinned</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>By Task Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterType("in-progress")}>In Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("completed")}>Completed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filter messages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="pinned">Pinned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl py-6 px-4">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="messages">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">No Messages Found</h2>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your search or filters"
                    : "You don't have any messages yet"}
                </p>
                <Button asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conv) => {
                  const otherParticipant = getOtherParticipant(conv);
                  const lastMessage = conv.messages[conv.messages.length - 1];
                  const isUnread = (conv.unreadCount || 0) > 0;
                  return (
                    <div key={conv._id} className="relative">
                      {conv.pinned && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2">
                          <Pin className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isUnread
                            ? "bg-primary/5 hover:bg-primary/10"
                            : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        } shadow-sm`}
                        onClick={() => router.push(`/notifications/chat/${conv._id}`)}
                      >
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          {otherParticipant?.photo ? (
                            <AvatarImage
                              src={
                                otherParticipant.photo.startsWith("http")
                                  ? otherParticipant.photo
                                  : `http://localhost:5000${otherParticipant.photo}`
                              }
                              alt={otherParticipant.name || "User"}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {otherParticipant?.name ? otherParticipant.name.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{otherParticipant?.name || "User"}</h3>
                            <span className="text-xs text-muted-foreground">
                              {formatLastActivity(conv.lastActivity || lastMessage?.timestamp)}
                            </span>
                          </div>
                          {conv.task && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {conv.task.title}
                              </Badge>
                            </div>
                          )}
                          <p className={`text-sm truncate mt-1 ${isUnread ? "font-medium" : "text-muted-foreground"}`}>
                            {getLastMessage(conv)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isUnread && <Badge className="bg-primary text-primary-foreground">{conv.unreadCount}</Badge>}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => handlePinConversation(conv._id, e)}>
                                <Pin className="mr-2 h-4 w-4" />
                                {conv.pinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleMuteConversation(conv._id, e)}>
                                <BellOff className="mr-2 h-4 w-4" />
                                Mute
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleArchiveConversation(conv._id, e)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={(e) => handleDeleteConversation(conv._id, e)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Notifications Center</h2>
              <p className="text-muted-foreground mb-6">
                You'll see task updates, application notifications, and system alerts here.
              </p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Helper functions
