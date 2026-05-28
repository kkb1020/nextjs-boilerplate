import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET

if (!authSecret) {
  throw new Error("Auth configuration error: AUTH_SECRET (or NEXTAUTH_SECRET) is not set.")
}

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Auth configuration error: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (or AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET) is not set."
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: authSecret,
  debug: process.env.NODE_ENV !== "production",
  logger: {
    error(error) {
      console.error("[auth][error]", error)
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
