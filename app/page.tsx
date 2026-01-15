import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Navigation from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export default async function HomePage() {
  const user = await getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Exchange Skills, Build Community</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance">
              Join our time banking community. Offer your skills, earn credits, and help others while strengthening
              local connections.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {user ? (
                <>
                  <Button asChild size="lg">
                    <Link href="/protected/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/community-impact">View Community Impact</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/community-impact">View Community Impact</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-12 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Offer Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Share what you're good at - teaching, repairs, cleaning, caregiving, and more.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Earn Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get 1 credit per hour. Help others and build your credit balance.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Request Help</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Spend your credits to request help from skilled community members.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          <p>Community Time Bank © 2025. Building stronger communities through skill sharing.</p>
        </div>
      </footer>
    </div>
  )
}
