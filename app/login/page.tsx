"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Handle email/password login.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password: loginPassword,
      });
      localStorage.setItem("token", response.data.token);
      router.push(response.data.redirectTo || "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login.
  // If the backend indicates that the user already exists (firstTime === false),
  // immediately redirect to dashboard. Otherwise, store the Google token and show the role selection popup.
  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        tokenId: tokenResponse.credential,
      });
      // If not a first-time user, login directly to dashboard.
      if (!response.data.firstTime) {
        localStorage.setItem("token", response.data.token);
        router.push(response.data.redirectTo || "/dashboard");
      } else {
        // New user: prompt for role selection.
        setGoogleCredential(tokenResponse.credential);
        setShowRolePopup(true);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "";
      // If backend returns error specifically asking for role, show popup.
      if (errMsg === "Role is required. Please select 'student' or 'freelancer'.") {
        setGoogleCredential(tokenResponse.credential);
        setShowRolePopup(true);
      } else {
        setError(errMsg || "Google sign in failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign in was unsuccessful. Please try again.");
  };

  // When user selects a role, call the API with role and then redirect accordingly.
  // For new users, the chosen role will determine the complete profile path.
  const handleRoleSelect = async (role: string) => {
    if (!googleCredential) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        tokenId: googleCredential,
        role,
      });
      localStorage.setItem("token", response.data.token);
      setShowRolePopup(false);
      if (role === "freelancer") {
        router.push("/complete-freelancer-profile");
      } else if (role === "student") {
        router.push("/complete-user-profile");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password flow.
  const handleForgotPassword = async () => {
    setError("");
    setForgotSuccess("");
    if (!forgotEmail) {
      setError("Please enter your email address");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: forgotEmail,
      });
      setForgotSuccess(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-2 bg-primary/10 rounded-xl mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              F
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          {error && (
            <Alert variant="destructive" className="mt-4 mx-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-12 px-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPopup(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-12 px-4 pr-10"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Sign in <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Button>
            </CardContent>
          </form>

          <div className="px-6 pb-6">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="rectangular"
                size="large"
                text="continue_with"
              />
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* Role selection modal popup shown only for first-time Google logins */}
      {showRolePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4 text-center">
              Choose your role
            </h2>
            <p className="mb-4 text-center">
              Please select whether you want to sign up as a student or freelancer.
            </p>
            <div className="flex justify-around">
              <Button onClick={() => handleRoleSelect("student")}>
                Student
              </Button>
              <Button onClick={() => handleRoleSelect("freelancer")}>
                Freelancer
              </Button>
            </div>
            <div className="mt-4 text-center">
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setShowRolePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot password modal popup */}
      {showForgotPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4 text-center">Forgot Password?</h2>
            <p className="mb-4 text-center">
              Please enter your email address to receive a password reset link.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-12 px-4"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              {forgotSuccess && (
                <Alert variant="default">
                  <AlertDescription>{forgotSuccess}</AlertDescription>
                </Alert>
              )}
              <Button onClick={handleForgotPassword} className="w-full">
                Send Reset Link
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:underline"
                  onClick={() => {
                    setShowForgotPopup(false);
                    setForgotEmail("");
                    setForgotSuccess("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}