"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardTitle, CardFooter } from "@/components/ui/card"
import { Github, Linkedin, Code, Rocket, Star, Sparkles, Zap } from "lucide-react"
import { motion } from "framer-motion"

export default function CompleteFreelancerProfile() {
  const router = useRouter()
  const [github, setGithub] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:5000/api/profile/freelancer",
        { github, linkedin },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
      console.log("Freelancer profile updated, JWT Token:", token)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Profile update failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-500/20 rounded-full blur-xl"
          animate={{
            x: [0, -60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl"
            >
              <Code className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome, Freelancer! 👨‍💻</h1>
            <p className="text-white/70">Let's showcase your skills</p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl overflow-hidden">
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
                <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Complete Your Profile
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </CardTitle>
              </div>

              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-6">
                  {/* GitHub Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="github" className="text-white flex items-center gap-2 text-sm font-medium">
                      <div className="p-1 bg-gray-800 rounded">
                        <Github className="w-4 h-4 text-white" />
                      </div>
                      GitHub Profile
                    </Label>
                    <div className="relative group">
                      <Input
                        id="github"
                        placeholder="https://github.com/yourusername"
                        required
                        className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 pl-4"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-md pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* LinkedIn Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="linkedin" className="text-white flex items-center gap-2 text-sm font-medium">
                      <div className="p-1 bg-blue-600 rounded">
                        <Linkedin className="w-4 h-4 text-white" />
                      </div>
                      LinkedIn Profile
                    </Label>
                    <div className="relative group">
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/yourusername"
                        required
                        className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 pl-4"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-md pointer-events-none" />
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
                        <Zap className="w-4 h-4" />
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Info Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-yellow-500/20 rounded-full">
                        <Star className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm mb-1">Why we need this?</h4>
                        <p className="text-white/70 text-xs">
                          Your profiles help clients understand your expertise and build trust in your skills.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="w-full space-y-4"
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating your profile...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Rocket className="w-5 h-5" />
                          Launch My Developer Journey
                        </div>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-white/50 text-xs">🚀 Join 10,000+ freelancers already on the platform</p>
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
