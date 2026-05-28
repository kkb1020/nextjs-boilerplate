"use client"

import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { data: session, status } = useSession()

  const user = session?.user
  const isLoading = status === "loading"
  const isAuthed = status === "authenticated"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-lg text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Next.js 보일러플레이트</h1>
        <p className="text-muted-foreground">
          {isLoading
            ? "세션 확인 중..."
            : isAuthed
              ? `로그인됨: ${user?.name ?? user?.email ?? "알 수 없음"}`
              : "로그인 후 대시보드를 이용할 수 있습니다."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          disabled={isLoading || isAuthed}
        >
          Google 로그인
        </Button>

        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          disabled={isLoading || !isAuthed}
        >
          로그아웃
        </Button>

        <Button render={<Link href="/dashboard" />} variant="secondary" disabled={isLoading}>
          대시보드로
        </Button>
      </div>
    </div>
  )
}
