"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  LucideUser,
  Phone,
  School,
  Briefcase,
  Mail,
  MapPin,
  Calendar,
  Github,
  Linkedin,
  Globe,
  ArrowLeft,
  Share2,
  Loader2,
  Check
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  _id: string;
  name: string;
  photo: string;
  email?: string;
  phone?: string;
  college?: string;
  bio?: string;
  linkedIn?: string;
  github?: string;
  skills?: string[];
  role?: "student" | "freelancer" | string;
  location?: string;
  joinedDate?: string;
  company?: string;
  website?: string;
  isEmailVerified?: boolean;
  testimonials?: any[];
}

export default function ProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Get current user ID from localStorage.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId") || "";
      setCurrentUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Backend endpoint for GET /api/users/:id
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Check if the currently logged in user is viewing their own profile.
  const isOwnProfile = currentUserId === id;

  // Share profile functionality: uses navigator.share if available, otherwise copies URL.
  const handleShareProfile = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.name}'s Profile`,
          text: `Check out ${user?.name}'s profile on our platform.`,
          url: shareUrl
        });
      } catch (error) {
        console.error("Error sharing profile:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Profile URL copied to clipboard");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-24 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <LucideUser className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The user profile you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar – Profile Summary */}
          <div className="md:col-span-1 space-y-6">
            <Card className="overflow-hidden">
              {/* Cover Photo */}
              <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <CardHeader className="pt-0 relative">
                <div className="flex flex-col items-center">
                  {/* Avatar positioned to overlap the cover photo */}
                  <Avatar className="h-24 w-24 border-4 border-background -mt-12 mb-3">
                    <AvatarImage
                      src={user.photo?.startsWith("http") ? user.photo : `http://localhost:5000${user.photo}`}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-xl">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center">
                    <h2 className="text-xl font-bold text-center">{user.name}</h2>
                    {user.isEmailVerified && (
                      <div
                        className="ml-2 flex items-center justify-center rounded-full bg-green-100 p-1 shadow-md"
                        title="Verified"
                      >
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{user.role || "User"}</p>
                  
                  {/* Share button, shown only if not own profile */}
                  {!isOwnProfile && (
                    <div className="flex gap-2 mt-2 mb-4">
                      <Button size="sm" variant="outline" onClick={handleShareProfile}>
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                
                {/* Contact Information */}
                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium truncate">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{user.location}</span>
                    </div>
                  )}
                  {user.joinedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">{new Date(user.joinedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                
                {/* Social Links: For freelancers only, show GitHub and LinkedIn */}
                {user.role === "freelancer" && (
                  <div className="flex flex-wrap gap-2">
                    {user.github && (
                      <Button variant="outline" size="sm" asChild className="h-8">
                        <a href={user.github} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-1 h-4 w-4" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {user.linkedIn && (
                      <Button variant="outline" size="sm" asChild className="h-8">
                        <a href={user.linkedIn} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="mr-1 h-4 w-4" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                )}
                
                {/* If the user is a client (student), show Company info */}
                {user.role === "student" && user.company && (
                  <div className="mt-4">
                    <Badge variant="secondary">Company: {user.company}</Badge>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* For freelancers, show Education & Work if college is provided */}
            {user.role === "freelancer" && user.college && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Education & Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <School className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.college}</p>
                      <p className="text-sm text-muted-foreground">Education</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content – Display About, and for freelancers, Skills & (optionally) Testimonials */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="about">About</TabsTrigger>
                {user.role === "freelancer" && (
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="about" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.bio ? (
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {user.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No bio provided
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {user.role === "freelancer" && (
                <TabsContent value="skills" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {user.skills && user.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No skills listed
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* Additional Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{user.location || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium">
                      {user.website ? (
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {user.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}