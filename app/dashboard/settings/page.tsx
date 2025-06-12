"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { AlertCircle, Bell, Globe, Lock, LogOut, Trash2, User, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CommonHeader from "@/components/CommonHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("public");

  // Two-factor authentication states
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [tfaSecret, setTfaSecret] = useState("");
  const [tfaToken, setTfaToken] = useState("");

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setEmailVerified(response.data.isEmailVerified);

        if (response.data.settings) {
          setEmailNotifications(response.data.settings.emailNotifications ?? true);
          setPushNotifications(response.data.settings.pushNotifications ?? true);
          setDarkMode(response.data.settings.darkMode ?? false);
          setTwoFactorAuth(response.data.settings.twoFactorAuth ?? false);
          setProfileVisibility(response.data.settings.profileVisibility ?? "public");
        }
        setTfaEnabled(response.data.twoFactorEnabled || false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/settings",
        {
          emailNotifications,
          pushNotifications,
          darkMode,
          twoFactorAuth,
          profileVisibility,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Optionally, display a success notification.
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save settings");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      setDeleteDialogOpen(false);
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
  // Remove specific tokens from localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  
  // Remove specific tokens from sessionStorage
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  
  // Optionally, clear all stored cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
  
  router.push("/login");
};

  // Resend email verification using the dedicated endpoint.
  const handleResendVerification = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/resend-email",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend verification email");
    }
  };

  // Enable TFA: call backend to generate a TFA secret.
  const handleEnableTfa = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/2fa/enable",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTfaSecret(response.data.twoFactorSecret);
      alert(
        "Two-factor authentication secret generated. Scan the provided QR code or manually enter the secret in your authenticator app."
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to enable two-factor authentication");
    }
  };

  // Verify entered TFA token.
  const handleVerifyTfa = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/auth/2fa/verify",
        { token: tfaToken },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTfaEnabled(true);
      alert(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify two-factor authentication token");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
     <CommonHeader />
    <div className="container max-w-screen-xl py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:gap-6">
        <div className="md:w-1/4">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
              </div>
              <Separator className="my-4" />
              <nav className="flex flex-col space-y-1">
                <Button variant="ghost" className="justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Globe className="mr-2 h-4 w-4" />
                  Appearance
                </Button>
              </nav>
              <Separator className="my-4" />
              <Button
                variant="outline"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
              <Button variant="ghost" className="w-full justify-start mt-2" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="account" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>View and update your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Input value={user?.email || ""} readOnly className="bg-muted" />
                      {emailVerified ? (
                        <span className="text-green-600 font-medium">Verified</span>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleResendVerification}>
                          Verify
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your email is used for login and notifications.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                      {user?.role === "freelancer" ? "Freelancer" : "Student"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">Public Profile</div>
                        <div className="text-sm text-muted-foreground">Allow others to view your profile</div>
                      </div>
                      <Switch
                        checked={profileVisibility === "public"}
                        onCheckedChange={(checked) => setProfileVisibility(checked ? "public" : "private")}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Push Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive notifications on your device</div>
                    </div>
                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                    </div>
                    <Switch checked={tfaEnabled} onCheckedChange={() => {}} disabled />
                  </div>
                  {!tfaEnabled && (
                    <div className="space-y-4">
                      <Button onClick={handleEnableTfa}>Enable Two-Factor Authentication</Button>
                      {tfaSecret && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Your secret: <span className="font-mono">{tfaSecret}</span>
                          </p>
                          <Label htmlFor="tfaToken">Enter token from your authenticator app:</Label>
                          <Input
                            id="tfaToken"
                            value={tfaToken}
                            onChange={(e) => setTfaToken(e.target.value)}
                          />
                          <Button onClick={handleVerifyTfa}>Verify 2FA Token</Button>
                        </>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-2">
                    <Label>Change Password</Label>
                    <Button variant="outline" className="w-full">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how the application looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Dark Mode</div>
                      <div className="text-sm text-muted-foreground">Switch between light and dark themes</div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" /> Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. It will permanently delete your account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All your data, including profile information and tasks, will be permanently deleted.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="confirm">Type DELETE to confirm</Label>
              <Input
                id="confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}