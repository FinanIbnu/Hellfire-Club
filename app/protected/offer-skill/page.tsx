"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Home } from "lucide-react"

const CATEGORIES = ["Teaching", "Repairs", "Cleaning", "Caregiving", "Other"]

export default function OfferSkillPage() {
  const [skillName, setSkillName] = useState("")
  const [category, setCategory] = useState("Teaching")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error: insertError } = await supabase.from("skills").insert({
        user_id: user.id,
        skill_name: skillName,
        category: category.toLowerCase(),
        description,
      })

      if (insertError) throw insertError

      setSuccess(true)
      setSkillName("")
      setCategory("Teaching")
      setDescription("")

      setTimeout(() => {
        router.push("/protected/skills")
      }, 1500)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-sm text-muted-foreground mb-1">Create Offering</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/protected/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Offer a Skill</CardTitle>
            <CardDescription>Share your expertise and help the community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Skill Name</Label>
                <Input
                  id="skill-name"
                  placeholder="e.g., Python Tutoring, Home Repair, Gardening"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your skill and what you can help with..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

              {success && (
                <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
                  Skill added successfully! Redirecting...
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? "Adding skill..." : "Add Skill"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
