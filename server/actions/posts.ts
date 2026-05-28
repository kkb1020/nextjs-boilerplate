"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

function requireUserId(session: unknown) {
  const userId = (session as { user?: { id?: string } } | null)?.user?.id
  if (!userId) redirect("/login")
  return userId
}

export async function createPost(formData: FormData) {
  const session = await auth()
  const userId = requireUserId(session)

  const title = String(formData.get("title") ?? "").trim()
  const content = String(formData.get("content") ?? "").trim()

  if (!title || !content) {
    redirect("/dashboard/new")
  }

  await db.post.create({
    data: { title, content, authorId: userId },
  })

  redirect("/dashboard")
}

export async function updatePost(formData: FormData) {
  const session = await auth()
  const userId = requireUserId(session)

  const postId = String(formData.get("postId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const content = String(formData.get("content") ?? "").trim()

  if (!postId) redirect("/dashboard")
  if (!title || !content) redirect(`/dashboard/${postId}/edit`)

  const existing = await db.post.findUnique({ where: { id: postId } })
  if (!existing || existing.authorId !== userId) {
    redirect("/dashboard")
  }

  await db.post.update({
    where: { id: postId },
    data: { title, content },
  })

  redirect("/dashboard")
}

export async function deletePost(formData: FormData) {
  const session = await auth()
  const userId = requireUserId(session)

  const postId = String(formData.get("postId") ?? "")
  if (!postId) redirect("/dashboard")

  const existing = await db.post.findUnique({ where: { id: postId } })
  if (!existing || existing.authorId !== userId) {
    redirect("/dashboard")
  }

  await db.post.delete({ where: { id: postId } })

  redirect("/dashboard")
}
