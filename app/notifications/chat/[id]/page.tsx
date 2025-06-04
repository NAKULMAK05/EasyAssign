"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import jwt from "jsonwebtoken";
import { io, type Socket } from "socket.io-client";
import CryptoJS from "crypto-js";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  _id: string;
  _tempId?: string; // temporary id used for optimistic messages
  sender: { _id: string; name: string; photo: string };
  text: string;
  status: "pending" | "sent" | "received" | "read";
  timestamp: string;
  conversationId?: string;
  clientTemp?: boolean;
}

interface Conversation {
  _id: string;
  task: { _id: string; title: string };
  client: { _id: string; name: string; photo: string; online?: boolean };
  freelancer: { _id: string; name: string; photo: string; online?: boolean };
  messages: Message[];
}

interface DecodedToken {
  _id: string;
  iat?: number;
  exp?: number;
}

const ENCRYPTION_KEY = "your-encryption-key"; // must match your .env value

const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Decrypt only if the string is encrypted (i.e. starts with "U2FsdGVk")
const decryptMessage = (ciphertext: string, key: string): string => {
  if (!ciphertext.startsWith("U2FsdGVk")) {
    return ciphertext;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch (error) {
    console.error("Decryption error:", error);
    return ciphertext;
  }
};

const encryptMessage = (plaintext: string, key: string): string => {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
};

export default function ChatPage() {
  const { id } = useParams(); // conversation id
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<DecodedToken | null>(null);

  // Helper to check if a message is sent by current user.
  const isCurrentUserMessage = useCallback(
    (senderId: string): boolean =>
      currentUser ? currentUser._id === senderId : false,
    [currentUser]
  );

  // Decode token on mount.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded._id) {
        setCurrentUser(decoded);
      }
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize socket connection once.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const newSocket = io("http://localhost:5000", { auth: { token } });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Setup socket event listeners.
  useEffect(() => {
    if (!socket) return;

    socket.on("message", (incomingMessage: Message) => {
      // Decrypt the incoming message.
      const decryptedText = decryptMessage(incomingMessage.text, ENCRYPTION_KEY);
      const incoming = { ...incomingMessage, text: decryptedText };

      setConversation((prev) => {
        if (!prev) return prev;
        // If message is from current user, try to match with an optimistic message.
        if (currentUser && incoming.sender._id === currentUser._id) {
          const idx = prev.messages.findIndex((msg) => {
            // Check if optimistic message exists (clientTemp true) and tempId matches.
            if (msg.clientTemp && msg._tempId && incoming._tempId) {
              return msg._tempId === incoming._tempId;
            }
            // Alternatively, match based on text and close timestamp (within 3 sec).
            const timeDiff = Math.abs(
              new Date(incoming.timestamp).getTime() -
                new Date(msg.timestamp).getTime()
            );
            return msg.clientTemp && msg.text === incoming.text && timeDiff < 3000;
          });
          if (idx !== -1) {
            const updatedMessages = [...prev.messages];
            updatedMessages[idx] = { ...incoming, clientTemp: false };
            return { ...prev, messages: updatedMessages };
          }
        }
        // Otherwise, check whether this incoming message already exists (avoid duplicate append).
        if (prev.messages.some((msg) => msg._id === incoming._id)) {
          return prev;
        }
        return { ...prev, messages: [...prev.messages, incoming] };
      });

      // For messages from other users, inform backend to update delivery/read status.
      if (currentUser && incoming.sender._id !== currentUser._id) {
        socket.emit("messageDelivered", { messageId: incoming._id });
        socket.emit("markAsRead", [incoming._id]);
      }
    });

    socket.on(
      "messageStatus",
      ({ messageId, status }: { messageId: string; status: Message["status"] }) => {
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg._id === messageId
                    ? { ...msg, status, clientTemp: false }
                    : msg
                ),
              }
            : null
        );
      }
    );

    return () => {
      socket.off("message");
      socket.off("messageStatus");
    };
  }, [socket, currentUser]);

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
        const conv: Conversation = {
          ...response.data,
          messages: response.data.messages.map((msg: Message) => ({
            ...msg,
            text: decryptMessage(msg.text, ENCRYPTION_KEY),
            sender: { ...msg.sender, _id: msg.sender._id.toString() },
            clientTemp: false,
          })),
        };
        // Optionally remove any system messages if needed.
        if (
          conv.messages.length === 1 &&
          currentUser &&
          !isCurrentUserMessage(conv.messages[0].sender._id)
        ) {
          conv.messages = [];
        }
        setConversation(conv);
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchConversation();
    }
  }, [id, currentUser, isCurrentUserMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, scrollToBottom]);

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-gray-400" />;
      case "sent":
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
      case "received":
        return <CheckCheck className="h-3.5 w-3.5 text-green-500" />;
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !socket || !currentUser) return;
    setSending(true);
    // Use a temporary id for optimistic message correlation.
    const tempId = Date.now().toString();
    const timestamp = new Date().toISOString();
    try {
      const encryptedText = encryptMessage(newMessage, ENCRYPTION_KEY);
      const optimisticMessage: Message = {
        _id: tempId,
        _tempId: tempId,
        sender: { _id: currentUser._id, name: "", photo: "" },
        text: newMessage, // plain text for optimistic display
        status: "pending",
        timestamp,
        clientTemp: true,
      };

      setConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, optimisticMessage] } : null
      );
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/conversations/${conversation._id}/message`,
        { text: encryptedText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit("sendMessage", {
        conversationId: conversation._id,
        message: { ...optimisticMessage, text: encryptedText },
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

  const getOtherUser = (conv: Conversation) => {
    return conv.client._id === currentUser?._id ? conv.freelancer : conv.client;
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

  if (loading || !conversation) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4">Loading Conversation...</p>
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
        <div className="p-4 flex items-center gap-3 bg-[#292828] dark:bg-gray-800 text-white shadow-md">
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
              <p className="text-xs text-green-300">
                {otherUser.online ? "online" : "offline"}
              </p>
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
            <Button variant="ghost" size="sm" onClick={() => router.push(`/task/${typeof conversation.task === "object" ? conversation.task._id : ""}`)}>
              View Details
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
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
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
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
            className={`rounded-full ${newMessage.trim() ? "bg-[#00A884] hover:bg-[#008f70] text-white" : "bg-[#54656F] text-white dark:bg-gray-700 dark:text-gray-400"}`}
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