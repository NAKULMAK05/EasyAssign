"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import jwt from "jsonwebtoken";
import { io, type Socket } from "socket.io-client";
import {
  Send,
  Loader2,
  ArrowLeft,
  Check,
  CheckCheck,
  SmilePlus,
  MoreVertical,
  Phone,
  Video,
  Search,
  Paperclip,
  Mic,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    photo: string;
  };
  text: string;
  status: "sent" | "delivered" | "read" | "pending";
  timestamp: string;
  conversationId?: string;
}

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
  messages: Message[];
}

interface DecodedToken {
  _id: string;
  iat?: number;
  exp?: number;
}

const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Set current user by decoding JWT from localStorage.
  const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded._id) {
        setCurrentUser(decoded);
      }
    }
  }, []);

  // Helper: Identify if a message is sent by current user.
  const isCurrentUserMessage = useCallback(
    (senderId: string) => (currentUser ? currentUser._id === senderId : false),
    [currentUser]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize socket connection.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage.");
      return;
    }
    const newSocket = io("http://localhost:5000", {
      auth: { token },
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Setup socket event listeners.
  useEffect(() => {
    if (!socket || !conversation) return;
    socket.emit("joinConversation", conversation._id);

    socket.on("message", (incomingMessage: Message) => {
      setConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, incomingMessage] } : null
      );
      if (currentUser && incomingMessage.sender._id !== currentUser._id) {
        socket.emit("markAsRead", [incomingMessage._id]);
      }
    });

    socket.on("messageStatus", ({ messageId, status }) => {
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((msg) =>
                msg._id === messageId ? { ...msg, status } : msg
              ),
            }
          : null
      );
    });

    return () => {
      socket.off("message");
      socket.off("messageStatus");
    };
  }, [socket, conversation, currentUser]);

  // Fetch conversation data.
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not set");
        const response = await axios.get(
          `http://localhost:5000/api/conversations/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedConversation = {
          ...response.data,
          messages: response.data.messages.map((msg: Message) => ({
            ...msg,
            sender: { ...msg.sender, _id: msg.sender._id.toString() }
          }))
        };
        setConversation(updatedConversation);
        if (socket && currentUser) {
          const unreadMessages = updatedConversation.messages
            .filter((msg: Message) => msg.status !== "read" && msg.sender._id !== currentUser._id)
            .map((msg: Message) => msg._id);
          if (unreadMessages.length > 0) {
            socket.emit("markAsRead", unreadMessages);
          }
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchConversation();
    }
  }, [id, socket, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !socket || !currentUser) return;
    setSending(true);
    const tempId = Date.now().toString();
    try {
      const newMsg: Message = {
        _id: tempId,
        sender: { _id: currentUser._id, name: "", photo: "" },
        text: newMessage,
        status: "pending",
        timestamp: new Date().toISOString(),
      };
      setConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/conversations/${conversation._id}/message`,
        { text: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit("sendMessage", {
        conversationId: conversation._id,
        message: newMsg,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((msg) => msg._id !== tempId) } : null
      );
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.client._id === currentUser?._id ? conversation.freelancer : conversation.client;
  };

  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    let currentGroup: Message[] = [];
    messages.forEach((message) => {
      const messageDate = formatMessageDate(new Date(message.timestamp));
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    return groups;
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-gray-400" />;
      case "sent":
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  if (loading || !conversation) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-4 bg-[#075E54] dark:bg-gray-800 text-white">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px] bg-white/20" />
              <Skeleton className="h-3 w-[100px] bg-white/20" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4 bg-[#E4DDD6] dark:bg-gray-900">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <Skeleton className={`h-16 w-2/3 rounded-lg ${i % 2 === 0 ? "bg-[#DCF8C6]/50" : "bg-white/50"}`} />
              </div>
            ))}
          </div>
          <div className="p-4 border-t dark:border-gray-700 bg-[#F0F2F5] dark:bg-gray-800 flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const otherUser = getOtherUser(conversation);
  const messageGroups = groupMessagesByDate(conversation.messages);

  return (
    <div className="flex h-screen bg-[#E4DDD6] dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 flex items-center gap-3 bg-[#075E54] dark:bg-gray-800 text-white shadow-md">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/dashboard/profile/${otherUser._id}`)}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-white/10">
                {otherUser.photo ? (
                  <AvatarImage
                    src={otherUser.photo.startsWith("http") ? otherUser.photo : `http://localhost:5000${otherUser.photo}`}
                    alt={otherUser.name}
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
                {otherUser.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#075E54] dark:border-gray-800"></div>
                )}
              </Avatar>
            </div>
            <div>
              <h2 className="font-medium line-clamp-1">{otherUser.name}</h2>
              <p className="text-xs text-green-300">{otherUser.online ? "online" : "offline"}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                    <Phone className="h-5 w-5" />
                    <span className="sr-only">Call</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                    <Video className="h-5 w-5" />
                    <span className="sr-only">Video Call</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video Call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search in Conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Contact Info</DropdownMenuItem>
                <DropdownMenuItem>Select Messages</DropdownMenuItem>
                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                <DropdownMenuItem>Clear Messages</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500">Block Contact</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {conversation.task && (
          <div className="bg-[#F0F2F5] dark:bg-gray-800 px-4 py-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Task
              </Badge>
              <span className="text-sm font-medium">
                {typeof conversation.task === "object" ? conversation.task.title : conversation.task}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/task/${typeof conversation.task === "object" ? conversation.task._id : ""}`)}
            >
              View Details
            </Button>
          </div>
        )}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
                  {group.date}
                </Badge>
              </div>
              {group.messages.map((msg, msgIndex) => {
                const currentMsg = isCurrentUserMessage(msg.sender._id);
                const previousMessage = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                const isStartOfCluster = !previousMessage || previousMessage.sender._id !== msg.sender._id;
                return currentMsg ? (
                  <div key={msg._id} className="flex w-full justify-end mt-4">
                    <div className="max-w-[75%]">
                      <div className={`p-3 rounded-lg ${isStartOfCluster ? "rounded-tr-md" : "rounded-tr-xl"} bg-[#DCF8C6] dark:bg-[#005C4B] text-black dark:text-white`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {getMessageStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg._id} className="flex w-full justify-start mt-4">
                    {isStartOfCluster && (
                      <Avatar className="h-8 w-8 mr-1 self-end mb-1">
                        {msg.sender.photo ? (
                          <AvatarImage
                            src={msg.sender.photo.startsWith("http") ? msg.sender.photo : `http://localhost:5000${msg.sender.photo}`}
                            alt={msg.sender.name}
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {msg.sender.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    {!isStartOfCluster && <div className="w-8 mr-1"></div>}
                    <div className="max-w-[75%]">
                      <div className={`p-3 rounded-lg ${isStartOfCluster ? "rounded-tl-md" : "rounded-tl-xl"} bg-white dark:bg-gray-800 text-black dark:text-white`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8 mr-1">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-bl-none shadow-sm max-w-[75%]">
                <div className="flex space-x-1">
                  
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="bg-[#F0F2F5] dark:bg-gray-800 p-3 flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="rounded-full text-[#54656F] dark:text-gray-400">
            <SmilePlus className="h-5 w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-full text-[#54656F] dark:text-gray-400">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach</span>
          </Button>
          <Input
            type="text"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-full bg-white dark:bg-gray-700 border-none focus-visible:ring-1"
          />
          <Button
            type="submit"
            size="icon"
            className={`rounded-full ${
              newMessage.trim()
                ? "bg-[#00A884] hover:bg-[#008f70] text-white"
                : "bg-[#54656F] text-white dark:bg-gray-700 dark:text-gray-400"
            }`}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : newMessage.trim() ? (
              <Send className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <span className="sr-only">{newMessage.trim() ? "Send" : "Voice message"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}