"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Home } from "lucide-react"

interface Task {
  id: string
  title: string
  status: string
  credits_value: number
  created_at: string
  requester_id: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("requester_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setTasks(data || [])
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [supabase, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const openTasks = tasks.filter((t) => t.status === "open")
  const activeTasks = tasks.filter((t) => t.status === "accepted")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
            <p className="text-muted-foreground">Track tasks you&apos;ve created and are seeking help for</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/protected/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading tasks...</p>
        ) : (
          <Tabs defaultValue="open" className="w-full">
            <TabsList>
              <TabsTrigger value="open">Open ({openTasks.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeTasks.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              {openTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No open tasks.{" "}
                    <a href="/protected/request-help" className="text-primary underline">
                      Create one
                    </a>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {openTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{task.credits_value} credits offered</p>
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                          </div>
                          <Button variant="outline" asChild>
                            <Link href={`/protected/task/${task.id}`}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              {activeTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">No active tasks</CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{task.credits_value} credits offered</p>
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                          </div>
                          <Button variant="outline" asChild>
                            <Link href={`/protected/task/${task.id}`}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">No completed tasks yet</CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {completedTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{task.credits_value} credits awarded</p>
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                          </div>
                          <Button variant="outline" asChild>
                            <Link href={`/protected/task/${task.id}`}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
