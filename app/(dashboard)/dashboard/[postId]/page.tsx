import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { deletePost } from "@/server/actions/posts"
import { Button } from "@/components/ui/button"

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  const { postId } = await params

  const post = await db.post.findUnique({
    where: { id: postId },
    include: { author: { select: { name: true, email: true } } },
  })

  if (!post) redirect("/dashboard")

  const isAuthor = post.authorId === userId

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="truncate text-2xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            {post.author.name ?? post.author.email} · {new Date(post.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/dashboard" />} variant="outline">
            목록
          </Button>
          {isAuthor ? (
            <>
              <Button render={<Link href={`/dashboard/${post.id}/edit`} />} variant="secondary">
                수정
              </Button>
              <form action={deletePost}>
                <input type="hidden" name="postId" value={post.id} />
                <Button type="submit" variant="destructive">
                  삭제
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </header>

      <article className="rounded-xl border bg-background p-4">
        <div className="whitespace-pre-wrap text-sm leading-6">{post.content}</div>
      </article>
    </div>
  )
}
