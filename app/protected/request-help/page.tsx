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

export default function RequestHelpPage() {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("teaching")
  const [description, setDescription] = useState("")
  const [credits, setCredits] = useState("1")
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

      const { error: insertError } = await supabase.from("tasks").insert({
        requester_id: user.id,
        title,
        description,
        credits_value: Number.parseInt(credits),
        status: "open",
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTitle("")
      setDescription("")
      setCredits("1")

      setTimeout(() => {
        router.push("/protected/tasks")
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
            <h2 className="text-sm text-muted-foreground mb-1">Post a Request</h2>
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
            <CardTitle>Request Help</CardTitle>
            <CardDescription>Post a task and find someone to help from the community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">What do you need help with?</Label>
                <Input
                  id="title"
                  placeholder="e.g., Need someone to teach me piano"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                    <SelectItem value="teaching">Teaching</SelectItem>
                    <SelectItem value="repairs">Repairs</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="caregiving">Caregiving</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about what you need..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Credits Offered (1 credit = 1 hour)</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  required
                />
              </div>

              {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

              {success && (
                <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">Request posted! Redirecting...</div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? "Posting request..." : "Post Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
