"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";

function getPasswordStrength(password: string) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  if (strength <= 2) return { label: "Weak", color: "text-red-500" };
  if (strength === 3 || strength === 4) return { label: "Medium", color: "text-yellow-500" };
  return { label: "Strong", color: "text-green-500" };
}

export default function ForgetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // For toggling visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength state (computed from newPassword)
  const [passwordStrength, setPasswordStrength] = useState({ label: "", color: "" });
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing token");
    }
  }, [token]);

  // Update password strength when newPassword changes
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(newPassword));
    if (confirmPassword.length > 0) {
      setPasswordsMatch(newPassword === confirmPassword);
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.put("http://localhost:5000/api/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      setSuccess(response.data.message);
      // Optionally redirect user after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Your Password</h2>
        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="mb-4">
            {success}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <Label htmlFor="newPassword" className="mb-1 block">
              New Password
            </Label>
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-10 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNewPassword(!showNewPassword)}
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {newPassword && (
              <p className={`mt-2 text-sm ${passwordStrength.color}`}>
                Password Strength: {passwordStrength.label}
              </p>
            )}
          </div>
          <div className="mb-4 relative">
            <Label htmlFor="confirmPassword" className="mb-1 block">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-10 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {confirmPassword && passwordsMatch !== null && (
              <p className={`mt-2 text-sm ${passwordsMatch ? "text-green-500" : "text-red-500"}`}>
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}