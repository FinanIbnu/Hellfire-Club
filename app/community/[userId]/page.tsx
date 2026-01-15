"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface UserProfile {
  id: string
  full_name: string
  bio: string | null
}

interface UserBadge {
  badge_name: string
  badge_type: string
}

export default function CommunityProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [totalSkills, setTotalSkills] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single()
        setProfile(profileData)

        // Fetch badges
        const { data: badgesData } = await supabase
          .from("badges")
          .select("badge_name, badge_type")
          .eq("user_id", userId)
        setBadges(badgesData || [])

        // Fetch total hours
        const { data: completionsData } = await supabase
          .from("task_completions")
          .select("credits_transferred")
          .eq("provider_id", userId)
          .eq("confirmation_status", "approved")

        const hours = completionsData?.reduce((sum, item) => sum + (item.credits_transferred || 0), 0) || 0
        setTotalHours(hours)

        // Fetch total skills
        const { data: skillsData } = await supabase.from("skills").select("id").eq("user_id", userId)
        setTotalSkills(skillsData?.length || 0)
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, supabase])

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!profile) return <div className="p-8">Profile not found</div>

  const badgeIcons: Record<string, string> = {
    helper: "🤝",
    popular: "⭐",
    trusted: "✓",
    consistent: "🔄",
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{profile.full_name}</CardTitle>
            <CardDescription>{profile.bio || "No bio yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalHours}</p>
                <p className="text-sm text-muted-foreground">Hours Helped</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalSkills}</p>
                <p className="text-sm text-muted-foreground">Skills Offered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{badges.length}</p>
                <p className="text-sm text-muted-foreground">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge, idx) => (
                  <div key={idx} className="p-4 border border-border rounded-lg text-center">
                    <p className="text-3xl mb-2">{badgeIcons[badge.badge_type] || "🏆"}</p>
                    <p className="font-medium text-sm">{badge.badge_name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
