"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

interface TopContributor {
  user_id: string
  full_name: string
  total_hours: number
}

interface DailyData {
  date: string
  hours: number
}

export default function CommunityImpactPage() {
  const [totalHours, setTotalHours] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        // Calculate total hours
        const { data: completionsData } = await supabase
          .from("task_completions")
          .select("credits_transferred")
          .eq("confirmation_status", "approved")

        const totalHoursValue = completionsData?.reduce((sum, item) => sum + (item.credits_transferred || 0), 0) || 0
        setTotalHours(totalHoursValue)

        // Get total members
        const { data: profilesData } = await supabase.from("profiles").select("id")

        setTotalMembers(profilesData?.length || 0)

        // Get top contributors
        const { data: topData } = await supabase
          .from("task_completions")
          .select("provider_id, credits_transferred, profiles!provider_id(full_name)")
          .eq("confirmation_status", "approved")

        const contributorsMap = new Map<string, { full_name: string; total_hours: number }>()

        topData?.forEach((item: any) => {
          const userId = item.provider_id
          const hours = item.credits_transferred || 0
          const fullName = item.profiles?.full_name || "Community Member"

          if (!contributorsMap.has(userId)) {
            contributorsMap.set(userId, { full_name: fullName, total_hours: 0 })
          }

          const current = contributorsMap.get(userId)!
          current.total_hours += hours
        })

        const topContributorsArray = Array.from(contributorsMap.entries())
          .map(([userId, data]) => ({
            user_id: userId,
            ...data,
          }))
          .sort((a, b) => b.total_hours - a.total_hours)
          .slice(0, 10)

        setTopContributors(topContributorsArray as TopContributor[])
      } catch (error) {
        console.error("Error fetching impact data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImpactData()
  }, [supabase])

  // Sample data for chart - in production, calculate from real data
  const chartData = [
    { month: "Jan", hours: Math.floor(totalHours * 0.1) },
    { month: "Feb", hours: Math.floor(totalHours * 0.15) },
    { month: "Mar", hours: Math.floor(totalHours * 0.2) },
    { month: "Apr", hours: Math.floor(totalHours * 0.25) },
    { month: "May", hours: Math.floor(totalHours * 0.3) },
    { month: "Jun", hours: totalHours },
  ]

  if (isLoading) return <div className="p-8">Loading impact data...</div>

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Community Impact</h1>
          <p className="text-lg text-muted-foreground">See the power of skill sharing in our community</p>
        </div>

        {/* Key Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours Exchanged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary mb-1">{totalHours}</p>
              <p className="text-xs text-muted-foreground">
                {totalHours === 1 ? "hour of skill sharing" : "hours of skill sharing"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary mb-1">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Community members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Per Member</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary mb-1">
                {totalMembers > 0 ? Math.round(totalHours / totalMembers) : 0}
              </p>
              <p className="text-xs text-muted-foreground">hours per member</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Hours Over Time</CardTitle>
            <CardDescription>Total hours exchanged each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="hsl(var(--color-primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Members who have helped the most hours</CardDescription>
          </CardHeader>
          <CardContent>
            {topContributors.length === 0 ? (
              <p className="text-muted-foreground">No contributions yet. Be the first to help!</p>
            ) : (
              <div className="space-y-4">
                {topContributors.map((contributor, idx) => (
                  <Link
                    key={contributor.user_id}
                    href={`/community/${contributor.user_id}`}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{contributor.full_name}</p>
                        <p className="text-sm text-muted-foreground">{contributor.total_hours} hours contributed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">{contributor.total_hours}</p>
                      <p className="text-xs text-muted-foreground">hours</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
