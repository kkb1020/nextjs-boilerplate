import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Next.js 보일러플레이트</h1>
      <p className="text-muted-foreground">팀 표준 템플릿입니다. 바로 시작하세요.</p>
      <div className="flex gap-4">
        <Button render={<Link href="/login" />}>로그인</Button>
        <Button render={<Link href="/register" />} variant="outline">
          회원가입
        </Button>
      </div>
    </div>
  )
}
