import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import CreditBalance from "@/components/credit-balance"
import RecentTasks from "@/components/recent-tasks"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || "Community Member"}!</h1>
          <p className="text-muted-foreground">View your credits, tasks, and community contribution</p>
        </div>

        {/* Credit Card */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>Time Credits</CardTitle>
              <CardDescription>Your available credits to spend on services</CardDescription>
            </CardHeader>
            <CardContent>
              <CreditBalance userId={user.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/protected/offer-skill">Offer Skill</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/protected/request-help">Request Help</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/protected/explore">Explore Skills</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Tasks</CardTitle>
            <CardDescription>Tasks you&apos;ve created or accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTasks userId={user.id} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
