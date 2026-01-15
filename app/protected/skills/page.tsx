"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Home } from "lucide-react"

interface Skill {
  id: string
  skill_name: string
  category: string
  description: string
  created_at: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data, error } = await supabase.from("skills").select("*").eq("user_id", user.id)

        if (error) throw error
        setSkills(data || [])
      } catch (error) {
        console.error("Error fetching skills:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSkills()
  }, [supabase, router])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return

    try {
      const { error } = await supabase.from("skills").delete().eq("id", id)
      if (error) throw error
      setSkills(skills.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Error deleting skill:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">My Skills</h1>
            <p className="text-muted-foreground">Skills you&apos;re offering to the community</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/protected/dashboard" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/protected/offer-skill">Add Skill</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading skills...</p>
        ) : skills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven&apos;t offered any skills yet</p>
              <Button asChild>
                <Link href="/protected/offer-skill">Offer Your First Skill</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <Card key={skill.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                      <CardDescription>{new Date(skill.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge>{skill.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{skill.description}</p>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(skill.id)} className="w-full">
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
