"use client";

import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, CheckCircle, Github, Linkedin, Loader2, Mail, Phone, School, User } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const userData = response.data;
        setProfile(userData);
        setName(userData.name || "");
        setPhone(userData.phone || "");
        setCollege(userData.college || "");
        setBio(userData.bio || "");
        setLinkedinUrl(userData.linkedIn || "");
        setGithubUrl(userData.github || "");
        setSkills(userData.skills || []);
        
        // Calculate profile completion
        calculateProfileCompletion(userData);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const calculateProfileCompletion = (userData: any) => {
    const fields = [
      userData.name, 
      userData.phone, 
      userData.college, 
      userData.bio,
      userData.photo,
      userData.linkedIn,
      userData.github,
      userData.skills?.length > 0 // Check if skills exist
    ];
    
    const filledFields = fields.filter(Boolean).length;
    const percentage = Math.round((filledFields / fields.length) * 100);
    setCompletionPercentage(percentage);
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("college", college);
      formData.append("bio", bio);
      formData.append("linkedIn", linkedinUrl);
      formData.append("github", githubUrl);
      formData.append("skills", JSON.stringify(skills));
      
      if (photoFile) {
        formData.append("photo", photoFile);
      }
      
      const response = await axios.put("http://localhost:5000/api/users/profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProfile(response.data.user);
      calculateProfileCompletion(response.data.user);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar - Profile Summary */}
        <div className="md:w-1/3">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4 group">
                  <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={photoPreview || (profile?.photo ? (profile.photo.startsWith("http") ? profile.photo : `http://localhost:5000${profile.photo}`) : undefined)} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="text-xl font-bold">{name || "Your Name"}</h2>
                <p className="text-muted-foreground">{profile?.role === "freelancer" ? "Freelancer" : "Student"}</p>
                
                <div className="w-full mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Profile completion</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
                
                <Separator className="my-4" />
                
                <div className="w-full space-y-3">
                  {phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{phone}</span>
                    </div>
                  )}
                  
                  {college && (
                    <div className="flex items-center gap-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>{college}</span>
                    </div>
                  )}
                  
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className=" flex gap-2 w-25 mr-35">
                  {linkedinUrl && (
                    <Button variant="outline" size="icon" asChild className="w-full">
                      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  
                  {githubUrl && (
                    <Button variant="outline" size="icon" asChild className="w-full">
                      <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content - Edit Profile */}
        <div className="md:w-2/3">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="skills">Skills & Experience</TabsTrigger>
            </TabsList>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleUpdateProfile}>
              <TabsContent value="profile" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photo">Profile Photo</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={photoPreview || (profile?.photo ? (profile.photo.startsWith("http") ? profile.photo : `http://localhost:5000${profile.photo}`) : undefined)} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {name ? name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input 
                            id="photo" 
                            type="file" 
                            onChange={handlePhotoChange} 
                            className="hidden"
                          />
                          <Label 
                            htmlFor="photo" 
                            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Upload Photo
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Your full name" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          placeholder="Your phone number" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="college">College/University</Label>
                        <Input 
                          id="college" 
                          value={college} 
                          onChange={(e) => setCollege(e.target.value)} 
                          placeholder="Your college or university" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        placeholder="Tell us about yourself" 
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Social Profiles</CardTitle>
                    <CardDescription>
                      Connect your social profiles to showcase your work
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <div className="flex">
                        <div className="flex items-center justify-center h-10 w-10 rounded-l-md border border-r-0 bg-muted">
                          <Linkedin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input 
                          id="linkedin" 
                          value={linkedinUrl} 
                          onChange={(e) => setLinkedinUrl(e.target.value)} 
                          placeholder="https://linkedin.com/in/username" 
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub Profile</Label>
                      <div className="flex">
                        <div className="flex items-center justify-center h-10 w-10 rounded-l-md border border-r-0 bg-muted">
                          <Github className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input 
                          id="github" 
                          value={githubUrl} 
                          onChange={(e) => setGithubUrl(e.target.value)} 
                          placeholder="https://github.com/username" 
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="skills" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>
                      Add your skills to help clients find you for projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Skills</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skills.map(skill => (
                          <Badge 
                            key={skill} 
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1.5"
                          >
                            {skill}
                            <button 
                              type="button" 
                              className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
                              onClick={() => removeSkill(skill)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add a skill (e.g., JavaScript)" 
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={addSkill}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
