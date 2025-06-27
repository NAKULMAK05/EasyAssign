"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Role selection (student/freelancer)
  const [role, setRole] = useState("student");

  // Error and success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Google registration state
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [showRolePopup, setShowRolePopup] = useState(false);

  // Define backend URL (use env variable or default to localhost)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Traditional registration form submit handler.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    console.log("Submitting registration form");

    const payload = {
      name: `${firstName} ${lastName}`,
      email,
      password,
      role,
    };
    console.log("Payload to be sent:", payload);

    try {
      const response = await axios.post(`${backendUrl}/api/auth/register`, payload, {
        withCredentials: true,
      });
      console.log("Backend response:", response.data);
      localStorage.setItem("token", response.data.token);
      Cookies.set("authToken", response.data.token, { expires: 1, path: "/" });
      setSuccess(true);

      // Redirect after showing success message
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Error during registration:", err.message, err.response?.data);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Google registration success handler.
  const handleGoogleSuccess = (tokenResponse: any) => {
    console.log("Google credential received:", tokenResponse.credential);
    setGoogleCredential(tokenResponse.credential);
    setShowRolePopup(true);
  };

  const handleGoogleError = () => {
    setError("Google sign in was unsuccessful. Please try again.");
  };

  // Handler for role selection in the popup for Google registration.
  const handleRoleSelect = async (selectedRole: string) => {
    if (!googleCredential) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/google`,
        { tokenId: googleCredential, role: selectedRole },
        { withCredentials: true }
      );
      console.log("Google registration response:", response.data);
      localStorage.setItem("token", response.data.token);
      Cookies.set("authToken", response.data.token, { expires: 1, path: "/" });
      setShowRolePopup(false);
      router.push(response.data.redirectTo || "/dashboard");
    } catch (err: any) {
      console.error("Error during Google registration:", err.message, err.response?.data);
      setError(err.response?.data?.error || "Google registration failed");
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground mt-2">
            Join our freelancing platform today
          </p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          {error && (
            <Alert variant="destructive" className="mt-4 mx-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 mx-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Registration successful! Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                    className="h-12"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                    className="h-12"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-12 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with a number and a special character
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">I am a</Label>
                <RadioGroup
                  defaultValue={role}
                  onValueChange={(value: string) => setRole(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="cursor-pointer">
                      Student
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="freelancer" id="freelancer" />
                    <Label htmlFor="freelancer" className="cursor-pointer">
                      Freelancer
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || success}
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Create account <ArrowRight className="ml-2 h-5 w-5" />
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
                  Or register with
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {showRolePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4 text-center">
              Choose your role
            </h2>
            <p className="mb-4 text-center">
              Please select whether you want to register as a student or freelancer.
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
    </div>
  );
}