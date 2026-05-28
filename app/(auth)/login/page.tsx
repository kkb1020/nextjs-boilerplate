"use client"

import { useEffect, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch {
      setError("Google 로그인에 실패했습니다. 다시 시도해 주세요.")
      setLoading(false)
    }
  }

  if (status === "authenticated") return null

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>Google 계정으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? "Google로 이동 중..." : "Google로 계속하기"}
          </Button>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
