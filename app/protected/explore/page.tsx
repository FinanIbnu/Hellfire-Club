"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface Skill {
  id: string
  skill_name: string
  category: string
  description: string
  user_id: string
  full_name: string
}

export default function ExplorePage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [requestingSkillId, setRequestingSkillId] = useState<string | null>(null)
  const [requestTitle, setRequestTitle] = useState("")
  const [requestCredits, setRequestCredits] = useState("1")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true)
      try {
        const { data: userData } = await supabase.auth.getUser()
        setCurrentUserId(userData?.user?.id || null)

        let query = supabase.from("skills").select("id, skill_name, category, description, user_id")

        if (searchTerm) {
          query = query.or(`skill_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }

        const { data: skillsData, error: skillsError } = await query.limit(50)

        if (skillsError) {
          console.error("[v0] Skills query error:", skillsError)
          throw skillsError
        }

        if (!skillsData || skillsData.length === 0) {
          console.log("[v0] No skills found")
          setSkills([])
          setIsLoading(false)
          return
        }

        const userIds = [...new Set(skillsData.map((s) => s.user_id))]
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)

        if (profilesError) {
          console.error("[v0] Profiles query error:", profilesError)
          throw profilesError
        }

        // Create a map of user_id -> full_name
        const profileMap = new Map(profilesData?.map((p) => [p.id, p.full_name]) || [])

        // Merge skills with profile data
        const enrichedSkills = skillsData.map((skill) => ({
          ...skill,
          full_name: profileMap.get(skill.user_id) || "Community Member",
        }))

        console.log("[v0] Skills fetched:", enrichedSkills)
        setSkills(enrichedSkills)
      } catch (error) {
        console.error("[v0] Error fetching skills:", error)
        setSkills([])
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchSkills()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, supabase])

  const handleRequestClick = (skill: Skill) => {
    if (!currentUserId) {
      router.push("/auth/login")
      return
    }
    if (currentUserId === skill.user_id) {
      setError("You cannot request help for your own skill")
      setTimeout(() => setError(null), 3000)
      return
    }
    setRequestingSkillId(skill.id)
    setRequestTitle(`Get help with: ${skill.skill_name}`)
  }

  const handleSubmitRequest = async () => {
    if (!currentUserId || !requestingSkillId) return

    try {
      setError(null)
      const { error: insertError } = await supabase.from("tasks").insert({
        requester_id: currentUserId,
        skill_id: requestingSkillId,
        title: requestTitle,
        description: `Requested help for: ${requestTitle}`,
        credits_value: Number.parseInt(requestCredits),
        status: "open",
      })

      if (insertError) throw insertError

      setSuccess("Request posted! Community members can now accept and help.")
      setRequestingSkillId(null)
      setRequestTitle("")
      setRequestCredits("1")

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred"
      console.error("[v0] Error creating request:", error)
      setError(errorMsg)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">Explore Community Skills</h1>
            <Input
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Button variant="ghost" size="sm" asChild className="ml-2">
            <Link href="/protected/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading skills...</p>
        ) : skills.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No skills found. Try a different search!
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <Card key={skill.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                      <CardDescription>{skill.full_name}</CardDescription>
                    </div>
                    <Badge>{skill.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{skill.description}</p>
                  {currentUserId === skill.user_id ? (
                    <p className="text-xs text-muted-foreground">This is your skill</p>
                  ) : (
                    <Button className="w-full" onClick={() => handleRequestClick(skill)}>
                      Request Help
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {requestingSkillId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Request Help</CardTitle>
                <CardDescription>How many credits would you like to offer?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
                {success && <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">{success}</div>}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Credits Offered (1 credit = 1 hour)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={requestCredits}
                    onChange={(e) => setRequestCredits(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setRequestingSkillId(null)
                      setRequestTitle("")
                      setRequestCredits("1")
                      setError(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSubmitRequest}>
                    Submit Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
