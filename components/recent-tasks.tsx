"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface RecentTasksProps {
  userId: string
}

interface Task {
  id: string
  title: string
  status: string
  credits_value: number
}

export default function RecentTasks({ userId }: RecentTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, status, credits_value")
          .eq("requester_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) throw error
        setTasks(data || [])
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [userId, supabase])

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No tasks yet. Start requesting help!</p>
        <Button asChild>
          <Link href="/protected/request-help">Create Task</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium">{task.title}</h4>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{task.credits_value} credits</Badge>
              <Badge>{task.status}</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => {
              console.log("[v0] Navigating to task:", task.id)
              router.push(`/protected/task/${task.id}`)
            }}
          >
            Open
          </Button>
        </div>
      ))}
    </div>
  )
}
