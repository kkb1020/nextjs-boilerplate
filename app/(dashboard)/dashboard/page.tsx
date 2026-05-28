import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logout } from "@/server/actions/auth"
import { deletePost } from "@/server/actions/posts"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user
  const userId = user?.id

  if (!userId) redirect("/login")

  const posts = await db.post.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
    take: 50,
  })

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground">{user?.name ?? user?.email} 님</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/dashboard/new" />}>글쓰기</Button>
          <form action={logout}>
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        </div>
      </header>

      <section className="rounded-xl border bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">내 글</h2>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            아직 작성한 글이 없습니다. 첫 글을 작성해 보세요.
          </div>
        ) : (
          <ul className="divide-y">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/${post.id}/edit`}
                    className="block truncate font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {new Date(post.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    render={<Link href={`/dashboard/${post.id}/edit`} />}
                    variant="secondary"
                    size="sm"
                  >
                    수정
                  </Button>
                  <form action={deletePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      삭제
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
