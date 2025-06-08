"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Search,
  MessageSquare,
  ArrowLeft,
  Filter,
  Pin,
  MoreVertical,
  Archive,
  Trash2,
  Clock,
  Settings,
  Users,
  CheckCheck,
  Check,
  Circle,
  Star,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Phone,
  Video,
  Info,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import CryptoJS from "crypto-js";

// ---------- Helper functions ----------
const encryptionKey = "your-encryption-key";

const safeDecrypt = (ciphertext: string): string => {
  if (!ciphertext || typeof ciphertext !== "string") return ciphertext;
  if (!encryptionKey || !ciphertext.startsWith("U2FsdGVk")) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    if (bytes.sigBytes <= 0) return ciphertext;
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch (error) {
    console.error("Decryption error:", error);
    return ciphertext;
  }
};

const getCurrentUserId = (): string => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload._id || payload.id || payload.sub || "";
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  }
  return localStorage.getItem("userId") || "";
};

// ---------- Interfaces ----------
interface Message {
  _id: string;
  sender: { _id: string; name?: string };
  text: string;
  status: "sent" | "delivered" | "read";
  timestamp: string;
}

interface Conversation {
  _id: string;
  task: { _id: string; title: string };
  client: { _id: string; name?: string; photo: string; online?: boolean; lastSeen?: string } | null;
  freelancer: { _id: string; name?: string; photo: string; online?: boolean; lastSeen?: string } | null;
  messages: Message[];
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isTyping?: boolean;
  priority?: "high" | "medium" | "low";
}

const getLastMessage = (conversation: Conversation, currentUserId: string): string => {
  if (!conversation.messages || conversation.messages.length === 0)
    return "No messages yet";
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const isOwnMessage = lastMessage.sender._id === currentUserId;
  const prefix = isOwnMessage ? "You: " : "";
  return `${prefix}${lastMessage.text}`;
};

// Updated getOtherUser to safely check properties and return a fallback if needed.
const getOtherUser = (conversation: Conversation) => {
  // If both client and freelancer exist, decide based on currentUserId.
  if (conversation.client && conversation.freelancer) {
    return String(conversation.client._id) === getCurrentUserId()
      ? conversation.freelancer
      : conversation.client;
  }
  // Fallback to whichever exists.
  return conversation.client || conversation.freelancer || { _id: "", name: "User", photo: "" };
};

// ---------- Component ----------
export default function NotificationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "unread" | "name">("recent");

  useEffect(() => {
    const id = getCurrentUserId();
    setCurrentUserId(id);
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/conversations", {
        headers: getAuthHeader(),
      });
      const convs = response.data.map((conv: Conversation) => {
        const msgs = conv.messages.map((msg) => ({
          ...msg,
          text: safeDecrypt(msg.text),
        }));
        return { ...conv, messages: msgs };
      });
      setConversations(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? "now" : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getMessageStatusIcon = (status: string, isOwnMessage: boolean) => {
    if (!isOwnMessage) return null;
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getFilteredConversations = () => {
    let filtered = conversations.filter((conv) => {
      const otherUser = getOtherUser(conv);
      // Safeguard: If otherUser or its name is missing, skip this conversation.
      if (!otherUser || !otherUser.name) return false;
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        otherUser.name.toLowerCase().includes(search) ||
        conv.task.title.toLowerCase().includes(search);
      if (!matchesSearch) return false;
      if (showOnlineOnly && !otherUser.online) return false;
      switch (activeTab) {
        case "unread":
          return conv.unreadCount > 0;
        case "pinned":
          return conv.isPinned;
        case "archived":
          return conv.isArchived;
        case "muted":
          return conv.isMuted;
        default:
          return !conv.isArchived;
      }
    });

    filtered.sort((a, b) => {
      // Important conversations come first.
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (a.priority !== "high" && b.priority === "high") return 1;
      // Then pinned conversations.
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort based on sortBy preference.
      switch (sortBy) {
        case "unread":
          return b.unreadCount - a.unreadCount;
        case "name":
          // Use optional chaining to safely compare names.
          return (getOtherUser(a)?.name || "").localeCompare(getOtherUser(b)?.name || "");
        default:
          const aTime = a.messages[a.messages.length - 1]?.timestamp || "";
          const bTime = b.messages[b.messages.length - 1]?.timestamp || "";
          return new Date(bTime).getTime() - new Date(aTime).getTime();
      }
    });

    return filtered;
  };

  const filteredConversations = getFilteredConversations();
  const unreadCount = conversations.filter((conv) => conv.unreadCount > 0).length;
  const pinnedCount = conversations.filter((conv) => conv.isPinned).length;
  const archivedCount = conversations.filter((conv) => conv.isArchived).length;
  const mutedCount = conversations.filter((conv) => conv.isMuted).length;

  // --- Action Handlers ---

  const handlePinConversation = async (convId: string, currentStatus: boolean) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/conversations/${convId}`,
        { isPinned: !currentStatus },
        { headers: getAuthHeader() }
      );
      fetchConversations();
    } catch (error) {
      console.error("Error updating pin:", error);
    }
  };

  const handleMuteConversation = async (convId: string, currentStatus: boolean) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/conversations/${convId}`,
        { isMuted: !currentStatus },
        { headers: getAuthHeader() }
      );
      fetchConversations();
    } catch (error) {
      console.error("Error updating mute:", error);
    }
  };

  const handleArchiveConversation = async (convId: string) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/conversations/${convId}`,
        { isArchived: true },
        { headers: getAuthHeader() }
      );
      fetchConversations();
    } catch (error) {
      console.error("Error archiving conversation:", error);
    }
  };

  const handleUnarchiveConversation = async (convId: string) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/conversations/${convId}`,
        { isArchived: false },
        { headers: getAuthHeader() }
      );
      fetchConversations();
    } catch (error) {
      console.error("Error unarchiving conversation:", error);
    }
  };

  const handleMarkImportant = async (convId: string, currentPriority: string) => {
    try {
      const newPriority = currentPriority === "high" ? "medium" : "high";
      await axios.patch(
        `http://localhost:5000/api/conversations/${convId}`,
        { priority: newPriority },
        { headers: getAuthHeader() }
      );
      fetchConversations();
    } catch (error) {
      console.error("Error marking important:", error);
    }
  };

  const handleToggleUnreadConversation = async (convId: string, currentUnreadCount: number) => {
    try {
      // Toggle unread: if current is >0 mark as read; otherwise mark as unread (for demo purposes, we simply set count to 1).
      const newUnreadCount = currentUnreadCount > 0 ? 0 : 1;
      await axios.patch(
        `http://localhost:5000/api/conversations/${convId}`,
        { unreadCount: newUnreadCount },
        { headers: getAuthHeader() }
      );
      fetchConversations();
    } catch (error) {
      console.error("Error toggling unread:", error);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/conversations/${convId}`, {
        headers: getAuthHeader(),
      });
      fetchConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild title="Back to Dashboard" className="rounded-full hover:bg-gray-800 text-white">
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back to Dashboard</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </h1>
                <p className="text-xs text-gray-400">{conversations.length} conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild title="Filter and sort options">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-800 text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("unread")}>
                    <Bell className="mr-2 h-4 w-4" />
                    Unread
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    <Users className="mr-2 h-4 w-4" />
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm">Online only</span>
                    <div className="scale-75">
                      <Switch checked={showOnlineOnly} onCheckedChange={setShowOnlineOnly} />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" title="Settings" className="rounded-full hover:bg-gray-800 text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 focus:border-gray-600 rounded-full"
            />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 max-w-6xl">
        {/* Tabs */}
        <div className="sticky top-[120px] bg-white z-40 py-4 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-black data-[state=active]:text-white">
                All
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {conversations.filter((c) => !c.isArchived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pinned" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Pinned
                {pinnedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {pinnedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Archived
                {archivedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {archivedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="muted" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Muted
                {mutedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {mutedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* Content */}
        <div className="py-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[140px]" />
                      <Skeleton className="h-3 w-[50px]" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-[80%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card className="border-none shadow-none bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <CardTitle className="text-xl mb-2 text-gray-900">
                  {searchQuery ? "No conversations found" : "No messages yet"}
                </CardTitle>
                <CardDescription className="text-center max-w-md mb-6">
                  {searchQuery
                    ? "Try adjusting your search terms or filters."
                    : "Start a conversation by posting a project or applying to one."}
                </CardDescription>
                <Button asChild className="bg-black hover:bg-gray-800">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="space-y-2">
              {filteredConversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                const lastMessage = conv.messages[conv.messages.length - 1];
                const isUnread = conv.unreadCount > 0;
                const isOwnLastMessage = lastMessage?.sender._id === currentUserId;
                return (
                  <div key={conv._id} className="relative group">
                    <div
                      className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                        isUnread
                          ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                      } ${conv.isPinned ? "ring-1 ring-gray-300" : ""}`}
                      onClick={() => router.push(`/notifications/chat/${conv._id}`)}
                    >
                      <div className="relative">
                        <Avatar className={`h-12 w-12 ${isUnread ? "ring-2 ring-black" : "ring-1 ring-gray-200"}`}>
                          {otherUser?.photo ? (
                            <AvatarImage
                              src={otherUser.photo.startsWith("http") ? otherUser.photo : `http://localhost:5000${otherUser.photo}`}
                              alt={otherUser.name || "User"}
                            />
                          ) : (
                            <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                              {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {otherUser?.online ? (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        ) : (
                          otherUser?.lastSeen && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-400 border-2 border-white"></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium truncate ${isUnread ? "text-black" : "text-gray-900"}`}>
                              {otherUser?.name || "User"}
                            </h3>
                            {conv.isPinned && <Pin className="h-3 w-3 text-gray-400" />}
                            {conv.isMuted && <VolumeX className="h-3 w-3 text-gray-400" />}
                          </div>
                          <div className="flex items-center gap-1">
                            {lastMessage && getMessageStatusIcon(lastMessage.status, isOwnLastMessage)}
                            <span className="text-xs text-gray-500">
                              {lastMessage && formatTime(lastMessage.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {conv.isTyping ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <div className="flex gap-1">
                                  <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce"></div>
                                  <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                  <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                </div>
                                <span className="text-sm">typing...</span>
                              </div>
                            ) : (
                              <p className={`text-sm truncate ${isUnread ? "font-medium text-gray-900" : "text-gray-600"}`}>
                                {getLastMessage(conv, currentUserId)}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 truncate mt-1">
                              Project: {conv.task?.title || "N/A"}
                            </p>
                          </div>
                          {isUnread && (
                            <Badge className="bg-black text-white rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={conv.isPinned ? "Unpin Conversation" : "Pin Conversation"}
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinConversation(conv._id, conv.isPinned || false);
                          }}
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={conv.isMuted ? "Unmute Conversation" : "Mute Conversation"}
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMuteConversation(conv._id, conv.isMuted || false);
                          }}
                        >
                          {conv.isMuted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={conv.priority === "high" ? "Unmark as Important" : "Mark as Important"}
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkImportant(conv._id, conv.priority || "medium");
                          }}
                        >
                          <Star className={`h-4 w-4 ${conv.priority === "high" ? "text-yellow-500" : "text-gray-400"}`} />
                        </Button>
                        {conv.isArchived ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Unarchive Conversation"
                            className="h-8 w-8 rounded-full hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnarchiveConversation(conv._id);
                            }}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Archive Conversation"
                            className="h-8 w-8 rounded-full hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveConversation(conv._id);
                            }}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Conversation"
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={isUnread ? "Mark as Read" : "Mark as Unread"}
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleUnreadConversation(conv._id, conv.unreadCount);
                          }}
                        >
                          {isUnread ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Call Conversation"
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Quick call action placeholder.
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Video Call Conversation"
                          className="h-8 w-8 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Video call action placeholder.
                          }}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild title="More Options" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-200">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Pin className="mr-2 h-4 w-4" />
                              {conv.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              {conv.isMuted ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                              {conv.isMuted ? "Unmute" : "Mute"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Star className="mr-2 h-4 w-4" />
                              Mark as Important
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              {isUnread ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                              Mark as {isUnread ? "Read" : "Unread"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600 focus:text-red-600">
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
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
}