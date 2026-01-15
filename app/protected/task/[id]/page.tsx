"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  title: string
  description: string
  status: string
  credits_value: number
  requester_id: string
  provider_id: string | null
  created_at: string
  profiles: { full_name: string }
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        setCurrentUser(userData?.user)

        const { data, error } = await supabase.from("tasks").select("*, profiles(full_name)").eq("id", taskId).single()

        if (error) throw error
        setTask(data)
        setSelectedStatus(data?.status)
      } catch (error) {
        console.error("Error fetching task:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [taskId, supabase])

  const handleAcceptTask = async () => {
    if (!currentUser || !task) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "accepted",
          provider_id: currentUser.id,
        })
        .eq("id", taskId)

      if (error) throw error

      setTask({
        ...task,
        status: "accepted",
        provider_id: currentUser.id,
      })
    } catch (error) {
      console.error("Error accepting task:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCompleteTask = async () => {
    if (!currentUser || !task) return

    setIsUpdating(true)
    try {
      // Update task status
      const { error: taskError } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (taskError) throw taskError

      // Create task completion record
      const { error: completionError } = await supabase.from("task_completions").insert({
        task_id: taskId,
        provider_id: currentUser.id,
        requester_id: task.requester_id,
        credits_transferred: task.credits_value,
        confirmation_status: "pending",
      })

      if (completionError) throw completionError

      // Add credits to provider
      const { error: creditError } = await supabase.from("credits").insert({
        user_id: currentUser.id,
        amount: task.credits_value,
        transaction_type: "earned",
        related_task_id: taskId,
        description: `Earned from task: ${task.title}`,
      })

      if (creditError) throw creditError

      setTask({
        ...task,
        status: "completed",
      })
    } catch (error) {
      console.error("Error completing task:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirmCompletion = async () => {
    if (!currentUser || !task) return

    setIsUpdating(true)
    try {
      // Update completion status
      const { error: updateError } = await supabase
        .from("task_completions")
        .update({ confirmation_status: "approved" })
        .eq("task_id", taskId)

      if (updateError) throw updateError

      // Spend requester's credits
      const { error: creditError } = await supabase.from("credits").insert({
        user_id: task.requester_id,
        amount: -task.credits_value,
        transaction_type: "spent",
        related_task_id: taskId,
        description: `Spent on task: ${task.title}`,
      })

      if (creditError) throw creditError

      router.push("/protected/tasks")
    } catch (error) {
      console.error("Error confirming completion:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!task) return <div className="p-8">Task not found</div>

  const isRequester = currentUser?.id === task.requester_id
  const isProvider = currentUser?.id === task.provider_id
  const isAvailable = task.status === "open"

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{task.title}</CardTitle>
            <CardDescription>Posted on {new Date(task.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-foreground">{task.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credits Offered</p>
                <p className="text-xl font-bold text-primary">{task.credits_value}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className="mt-1">{task.status}</Badge>
              </div>
            </div>

            {task.provider_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Assigned to</p>
                <p className="font-medium">{task.profiles?.full_name || "Community Member"}</p>
              </div>
            )}

            <div className="border-t border-border pt-6 space-y-3">
              {!currentUser ? (
                <Button className="w-full" onClick={() => router.push("/auth/login")}>
                  Login to Respond
                </Button>
              ) : isAvailable && !isRequester ? (
                <Button className="w-full" onClick={handleAcceptTask} disabled={isUpdating}>
                  {isUpdating ? "Accepting..." : "Accept Task"}
                </Button>
              ) : isProvider && task.status === "accepted" ? (
                <Button className="w-full" onClick={handleCompleteTask} disabled={isUpdating}>
                  {isUpdating ? "Completing..." : "Mark Complete"}
                </Button>
              ) : isRequester && task.status === "completed" ? (
                <Button className="w-full" onClick={handleConfirmCompletion} disabled={isUpdating}>
                  {isUpdating ? "Confirming..." : "Confirm & Transfer Credits"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
