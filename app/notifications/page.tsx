"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Search, MessageCirclePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Helper to get current user id from JWT in localStorage or from a fallback "userId" item.
const getCurrentUserId = (): string => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      // Decode the payload of the JWT.
      const payload = JSON.parse(atob(token.split(".")[1]));
      // Look for common properties for the user id.
      return payload._id || payload.id || payload.sub || "";
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  }
  // Fallback to using a stored userId if available.
  return localStorage.getItem("userId") || "";
};

interface Conversation {
  _id: string;
  task: { _id: string; title: string };
  client: {
    _id: string;
    name: string;
    photo: string;
    online?: boolean;
  };
  freelancer: {
    _id: string;
    name: string;
    photo: string;
    online?: boolean;
  };
  messages: Array<{
    _id: string;
    sender: { _id: string; name?: string };
    text: string;
    status: "sent" | "delivered" | "read";
    timestamp: string;
  }>;
  unreadCount: number;
}

export default function NotificationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const router = useRouter();

  // Update current user id using the helper (with fallback) on mount.
  useEffect(() => {
    const id = getCurrentUserId();
    setCurrentUserId(id);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(response.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    return date.toDateString() === now.toDateString()
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDisplayedSenderName = (lastMessage: Conversation["messages"][0] | undefined): string => {
    if (!lastMessage) return "";
    const messageSenderId = String(lastMessage.sender._id || "");
    // Use strict string comparison between sender id and current user id.
    if (messageSenderId === String(currentUserId)) {
      return "you";
    }
    // When the sender's name is missing or empty, default to "unknown".
    return lastMessage.sender.name && lastMessage.sender.name.trim().length > 0
      ? lastMessage.sender.name
      : "unknown";
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Conversations List */}
      <div className="w-full md:w-1/3 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Chats</h1>
            <Button variant="ghost" size="icon">
              <MessageCirclePlus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y dark:divide-gray-700">
              {conversations.map((conversation) => {
                // Determine the other user based on the current user's id.
                const otherUser =
                  String(conversation.client._id) === currentUserId
                    ? conversation.freelancer
                    : conversation.client;
                const lastMessage = conversation.messages[conversation.messages.length - 1];

                let displayedMessage = "No messages yet";
                if (lastMessage) {
                  const senderName = getDisplayedSenderName(lastMessage);
                  displayedMessage = `${senderName} : ${lastMessage.text}`;
                }

                return (
                  <Link
                    key={conversation._id}
                    href={`/notifications/chat/${conversation._id}`}
                    className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            otherUser.photo?.startsWith("http")
                              ? otherUser.photo
                              : `http://localhost:5000${otherUser.photo}`
                          }
                          alt={otherUser.name}
                        />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {otherUser.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{otherUser.name}</h3>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {displayedMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="ml-2">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Empty Chat State */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-2">
          <MessageCirclePlus className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Select a conversation</h2>
          <p className="text-muted-foreground">Start chatting with your connections</p>
        </div>
      </div>
    </div>
  );
}