"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Home } from "lucide-react"

interface IncomingRequest {
  id: string
  title: string
  description: string
  credits_value: number
  created_at: string
  requester_id: string
  requester_name: string
  status: string
  skill_id: string
}

export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState<IncomingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchIncomingRequests = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()

        if (!userData?.user) {
          router.push("/auth/login")
          return
        }

        // First, get all skills owned by current user
        const { data: userSkills, error: skillsError } = await supabase
          .from("skills")
          .select("id")
          .eq("user_id", userData.user.id)

        if (skillsError) throw skillsError

        const skillIds = userSkills?.map((s) => s.id) || []

        if (skillIds.length === 0) {
          setRequests([])
          setIsLoading(false)
          return
        }

        // Get all open tasks for these skills
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .in("skill_id", skillIds)
          .eq("status", "open")
          .is("provider_id", null)
          .order("created_at", { ascending: false })

        if (tasksError) throw tasksError

        if (!tasksData || tasksData.length === 0) {
          setRequests([])
          setIsLoading(false)
          return
        }

        // Get requester profiles
        const requesterIds = [...new Set(tasksData.map((t) => t.requester_id))]
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", requesterIds)

        if (profilesError) throw profilesError

        const profileMap = new Map(profilesData?.map((p) => [p.id, p.full_name]) || [])

        // Merge task data with profile data
        const enrichedRequests = tasksData.map((task) => ({
          ...task,
          requester_name: profileMap.get(task.requester_id) || "Community Member",
        }))

        console.log("[v0] Incoming requests fetched:", enrichedRequests)
        setRequests(enrichedRequests)
      } catch (error) {
        console.error("[v0] Error fetching incoming requests:", error)
        setError("Failed to load incoming requests")
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncomingRequests()
  }, [supabase, router])

  const handleAccept = async (taskId: string) => {
    try {
      setAcceptingId(taskId)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        setError("You must be logged in to accept a request")
        return
      }

      // Update the task to set provider_id and change status to accepted
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          provider_id: userData.user.id,
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (updateError) throw updateError

      // Remove the accepted request from the list
      setRequests(requests.filter((r) => r.id !== taskId))
      console.log("[v0] Request accepted successfully")
    } catch (error) {
      console.error("[v0] Error accepting request:", error)
      setError("Failed to accept request. Please try again.")
    } finally {
      setAcceptingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Incoming Requests</h1>
            <p className="text-muted-foreground">Help requests for your skills that you can accept</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/protected/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading requests...</p>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No incoming requests at this time</p>
              <Button asChild variant="outline">
                <Link href="/protected/explore">Explore Community</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{request.title}</h3>
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm">
                          <span className="font-medium">From:</span> {request.requester_name}
                        </span>
                        <span className="text-sm">
                          <span className="font-medium">Credits offered:</span> {request.credits_value}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAccept(request.id)}
                      disabled={acceptingId === request.id}
                      className="whitespace-nowrap"
                    >
                      {acceptingId === request.id ? "Accepting..." : "Accept Request"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
