"use server"

import { signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { AuthError } from "next-auth"

export async function login(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "이메일 또는 비밀번호가 올바르지 않습니다." }
        default:
          return { error: "로그인 중 오류가 발생했습니다." }
      }
    }
    throw error
  }
}

export async function register(name: string, email: string, password: string) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "이미 사용 중인 이메일입니다." }

  const hashedPassword = await hash(password, 12)
  await db.user.create({
    data: { name, email, hashedPassword },
  })

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "회원가입 후 로그인 중 오류가 발생했습니다." }
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}
