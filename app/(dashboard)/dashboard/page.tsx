import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { logout } from "@/server/actions/auth"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground">
        안녕하세요, {session.user.name ?? session.user.email}님
      </p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          로그아웃
        </Button>
      </form>
    </div>
  )
}
