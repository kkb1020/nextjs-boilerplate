import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Next.js 보일러플레이트</h1>
      <p className="text-muted-foreground">Google 로그인으로 접속하세요.</p>
      <div className="flex gap-4">
        <Button render={<Link href="/login" />}>로그인</Button>
      </div>
    </div>
  )
}
