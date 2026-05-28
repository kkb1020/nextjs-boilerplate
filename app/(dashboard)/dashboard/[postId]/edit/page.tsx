import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { updatePost } from "@/server/actions/posts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  const { postId } = await params
  const post = await db.post.findUnique({ where: { id: postId } })
  if (!post || post.authorId !== userId) redirect("/dashboard")

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">글 수정</h1>
          <p className="text-sm text-muted-foreground">작성한 글을 수정합니다.</p>
        </div>
        <Button render={<Link href="/dashboard" />} variant="outline">
          목록
        </Button>
      </header>

      <form action={updatePost} className="space-y-5">
        <input type="hidden" name="postId" value={post.id} />
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required maxLength={100} defaultValue={post.title} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">내용</Label>
          <textarea
            id="content"
            name="content"
            required
            rows={12}
            defaultValue={post.content}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">저장</Button>
          <Button render={<Link href="/dashboard" />} type="button" variant="secondary">
            취소
          </Button>
        </div>
      </form>
    </div>
  )
}
