"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent, useRef } from "react"
import axios from "axios"
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  ImageIcon,
  Mic,
  Smile,
  Phone,
  Video,
  Loader2,
  Clock,
  Check,
  CheckCheck,
  Search,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Message {
  _id: string
  text: string
  sender: string | { _id: string; name: string; photo: string }
  timestamp: string
  status?: "sent" | "delivered" | "read" | "pending"
  attachments?: string[]
}

interface Conversation {
  _id: string
  participants: (string | { _id: string; name: string; photo: string })[]
  messages: Message[]
  task?: string | { _id: string; title: string; status?: string }
  unreadCount?: number
  lastActivity?: string
  pinned?: boolean
}

function getSender(sender: string | { _id: string; name: string; photo: string }) {
  return typeof sender === "object" ? sender : { _id: sender, name: "User", photo: "" }
}

export default function ChatConversationPage() {
  const { id } = useParams()
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("userId") || "")
    }
  }, [])

  const fetchConversation = async () => {
    setIsLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:5000/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConversation(response.data)
    } catch (err: any) {
      console.error("Error fetching conversation:", err.response?.data || err.message)
      setError(err.response?.data?.message || "Failed to load conversation")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchConversation()
      const interval = setInterval(fetchConversation, 30000)
      return () => clearInterval(interval)
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setIsSending(true)

    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      text: message,
      sender: { _id: currentUserId, name: "You", photo: "" },
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    setConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, tempMessage] } : prev))
    const msgToSend = message
    setMessage("")

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://localhost:5000/api/conversations/${id}/message`,
        { text: msgToSend },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setConversation(response.data.conversation)
    } catch (err) {
      console.error("Error sending message:", err)
      setConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((msg) => !msg._id.startsWith("temp-")) } : prev,
      )
      setError("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMessageStatus = (msg: Message) => {
    const senderObj = getSender(msg.sender)
    if (senderObj._id !== currentUserId) return null
    switch (msg.status) {
      case "pending":
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return <Check className="h-3 w-3 text-muted-foreground" />
    }
  }

  const groupMessagesByDate = () => {
    if (!conversation?.messages) return []

    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""
    let currentGroup: Message[] = []

    conversation.messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString()

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }

    return groups
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4 h-[80vh] flex flex-col items-center justify-center">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notifications
        </Button>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="container max-w-4xl mx-auto p-4 h-[80vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <Avatar className="h-16 w-16 mx-auto">
            <AvatarFallback className="bg-primary/10 text-primary">U</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mt-4">Conversation Not Found</h2>
          <p className="text-muted-foreground mt-2">
            This conversation may have been deleted or you don't have access.
          </p>
          <Button onClick={() => router.push("/notifications")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notifications
          </Button>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate()
  const getOtherParticipant = () => {
    if (!conversation.participants) return null
    const other = conversation.participants.find((p: any) =>
      typeof p === "object" ? p._id !== currentUserId : p !== currentUserId,
    )
    return typeof other === "object" ? other : null
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Chat Header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm py-3 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
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
            <div>
              <h2 className="font-medium line-clamp-1">{otherParticipant?.name || "User"}</h2>
              <p className="text-xs text-green-500">online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Conversation Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Contact Info</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Block Contact</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

    {/* Messages Container */}
<div className="flex-1 overflow-y-auto p-4 space-y-4 w-full bg-[url('/whatsapp-bg.png')] bg-repeat bg-opacity-10">
  {messageGroups.map((group, groupIndex) => (
    <div key={groupIndex} className="space-y-4 w-full">
      {/* Date Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
          {new Date(group.date).toLocaleDateString()}
        </Badge>
      </div>

      {group.messages.map((msg, msgIndex) => {
        const senderObj = getSender(msg.sender);
        const isCurrentUser = senderObj._id === currentUserId;

        // Show avatar if previous message is from a different sender
        const previousSenderId =
          msgIndex > 0 ? getSender(group.messages[msgIndex - 1].sender)._id : "";
        const showAvatar = !isCurrentUser && senderObj._id !== previousSenderId;

        return (
          <div
            key={currentUserId || msgIndex}
            className={`w-full flex ${isCurrentUser ? "justify-end" : "justify-start"} items-start gap-2`}
          >
            {/* If not current user and showAvatar is true, display their avatar on the left */}
            {!isCurrentUser && showAvatar && (
              <Avatar className="h-8 w-8 mt-1">
                {senderObj.photo ? (
                  <AvatarImage
                    src={
                      senderObj.photo.startsWith("http")
                        ? senderObj.photo
                        : `http://localhost:5000${senderObj.photo}`
                    }
                    alt={senderObj.name || "User"}
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {senderObj.name ? senderObj.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                )}
              </Avatar>
            )}

            {/* The bubble container */}
            <div className={`max-w-[75%] flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
              {/* If not current user and showAvatar is true, show their name above the bubble */}
              {!isCurrentUser && showAvatar && (
                <p className="text-xs text-gray-600 mb-1">{senderObj.name}</p>
              )}

              {/* Message bubble */}
              <div
                className={`relative p-3 rounded-lg shadow ${
                  isCurrentUser
                    ? "bg-[#DCF8C6] text-black rounded-bl-none"
                    : "bg-white dark:bg-gray-800 text-black rounded-br-none"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.text}</p>

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {msg.attachments.map((attachment, i) => (
                      <div key={i} className="rounded overflow-hidden bg-black/5">
                        <img
                          src={
                            attachment.startsWith("http")
                              ? attachment
                              : `http://localhost:5000${attachment}`
                          }
                          alt={`Attachment ${i + 1}`}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp and status */}
              <div
                className={`flex items-center gap-1 mt-1 text-xs ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {isCurrentUser && getMessageStatus(msg)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ))}
  <div ref={messagesEndRef} />
</div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 border-t p-3 flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" className="rounded-full">
          <Smile className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="rounded-full">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus-visible:ring-1"
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full bg-green-500 hover:bg-green-600 text-white"
          disabled={isSending || !message.trim()}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  )
}