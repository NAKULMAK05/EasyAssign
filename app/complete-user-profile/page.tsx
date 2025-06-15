"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardTitle, CardFooter } from "@/components/ui/card"
import { Users, BookOpen, Lightbulb, Sparkles, Heart, Trophy } from "lucide-react"
import { motion } from "framer-motion"

export default function CompleteClientProfile() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:5000/api/profile/client",
        { companyName },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      console.log("Client profile updated, JWT Token:", token)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Profile update failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Shapes */}
        <motion.div
          className="absolute top-32 left-16 w-28 h-28 bg-emerald-500/20 rounded-full blur-xl"
          animate={{
            x: [0, 80, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 7,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 right-20 w-36 h-36 bg-teal-500/20 rounded-full blur-xl"
          animate={{
            x: [0, -70, 0],
            y: [0, 50, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 9,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />

        {/* Subtle Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-2xl"
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Hey there, Client! 👋</h1>
            <p className="text-white/70">Ready to bring your vision to life?</p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl overflow-hidden">
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-6 border-b border-white/10">
                <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
                  <Heart className="w-6 h-6 text-pink-400" />
                  Complete Your Profile
                  <Heart className="w-6 h-6 text-pink-400" />
                </CardTitle>
              </div>

              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-6">
                  {/* Company/Organization Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="companyName" className="text-white flex items-center gap-2 text-sm font-medium">
                      <div className="p-1 bg-emerald-600 rounded">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      Company/Organization Name
                    </Label>
                    <div className="relative group">
                      <Input
                        id="companyName"
                        placeholder="Enter your company or organization name"
                        required
                        className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 pl-4"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-md pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                    >
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Info Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-yellow-500/20 rounded-full">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm mb-1">Why we ask this?</h4>
                        <p className="text-white/70 text-xs">
                          We'll use your company information to connect you with top industry professionals and tailor opportunities to grow your business!
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Benefits Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-3"
                  >
                    <h4 className="text-white font-medium text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      What you'll get:
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "🤝 Connect with top talent",
                        "💡 Gain innovative solutions",
                        "🌟 Expand your professional network",
                        "🚀 Accelerate project success",
                      ].map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                          className="text-white/80 text-xs bg-white/5 rounded-lg p-2"
                        >
                          {benefit}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="w-full space-y-4"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Setting up your profile...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Build Your Business Network
                        </div>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-white/50 text-xs">🚀 Connect with industry leaders and grow your enterprise</p>
                    </div>
                  </motion.div>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}