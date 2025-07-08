"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Lock, Cake, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      toast.error("Username wajib diisi")
      return
    }

    if (!formData.password) {
      toast.error("Password wajib diisi")
      return
    }

    setIsSubmitting(true)

    try {
      await login(formData.username, formData.password)
      toast.success("Login berhasil! Selamat datang kembali")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login gagal"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <Card className="w-full max-w-md cotton-candy-card border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Cake className="h-12 w-12 text-pink-500" />
              <Sparkles className="h-6 w-6 text-purple-400 absolute -top-1 -right-1 animate-pulse-soft" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            NAY'S CAKE
          </CardTitle>
          <p className="text-gray-600 mt-2">Masuk ke Sistem Inventaris</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-10 border-pink-200 focus:border-pink-400 rounded-xl h-12"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-10 border-pink-200 focus:border-pink-400 rounded-xl h-12"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full cotton-candy-button from-pink-400 to-purple-400 rounded-xl h-12 text-lg font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
