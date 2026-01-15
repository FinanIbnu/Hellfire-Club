"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface CreditBalanceProps {
  userId: string
}

export default function CreditBalance({ userId }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase.from("credits").select("amount").eq("user_id", userId)

        if (error) throw error

        const total = data?.reduce((sum, credit) => sum + credit.amount, 0) || 0
        setBalance(total)
      } catch (error) {
        console.error("Error fetching balance:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [userId, supabase])

  if (isLoading) return <div className="text-lg font-semibold">Loading...</div>

  return (
    <div className="text-4xl font-bold text-primary mb-2">
      {balance}
      <span className="text-lg text-muted-foreground ml-2">credits</span>
    </div>
  )
}
