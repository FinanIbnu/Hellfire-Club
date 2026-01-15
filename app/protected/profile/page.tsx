"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Home } from "lucide-react"

interface Profile {
  id: string
  full_name: string
  bio: string | null
  avatar_url: string | null
}

interface Badge {
  id: string
  badge_name: string
  badge_type: string
  earned_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [totalHours, setTotalHours] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)
        setFullName(profileData?.full_name || "")
        setBio(profileData?.bio || "")

        // Fetch badges
        const { data: badgesData, error: badgesError } = await supabase
          .from("badges")
          .select("*")
          .eq("user_id", user.id)

        if (badgesError) throw badgesError
        setBadges(badgesData || [])

        // Fetch total hours
        const { data: completionsData, error: completionsError } = await supabase
          .from("task_completions")
          .select("credits_transferred")
          .eq("provider_id", user.id)
          .eq("confirmation_status", "approved")

        if (completionsError) throw completionsError
        const hours = completionsData?.reduce((sum, item) => sum + (item.credits_transferred || 0), 0) || 0
        setTotalHours(hours)
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      setProfile({ ...profile, full_name: fullName, bio })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/protected/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Profile Information</CardTitle>
                <CardDescription>Manage your public profile and information</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about your skills and interests..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                  <p className="text-lg font-semibold">{fullName || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Bio</p>
                  <p className="text-foreground">{bio || "No bio yet"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total Hours Contributed</p>
                  <p className="text-3xl font-bold text-primary">{totalHours} hours</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card>
          <CardHeader>
            <CardTitle>Badges & Recognition</CardTitle>
            <CardDescription>Achievements earned through community contributions</CardDescription>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <p className="text-muted-foreground">No badges yet. Keep contributing to earn them!</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="p-4 border border-border rounded-lg text-center">
                    <p className="text-3xl mb-2">{badgeIcons[badge.badge_type] || "🏆"}</p>
                    <p className="font-medium text-sm">{badge.badge_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
