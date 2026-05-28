import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(req: NextRequest) {
  // Ensure the OAuth flow stays on a single canonical host.
  // If the user starts sign-in on a different Vercel alias domain than AUTH_URL,
  // the PKCE cookie is set on the wrong host and the callback will fail.
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
  if (authUrl) {
    try {
      const canonicalHost = new URL(authUrl).host
      const reqHost = req.nextUrl.host

      if (canonicalHost && reqHost && canonicalHost !== reqHost) {
        const url = req.nextUrl.clone()
        url.host = canonicalHost
        url.protocol = "https:"
        return NextResponse.redirect(url)
      }
    } catch {
      // Ignore invalid AUTH_URL/NEXTAUTH_URL
    }
  }

  // Public paths that must not trigger auth redirects, otherwise we create loops.
  const pathname = req.nextUrl.pathname
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Only protect dashboard routes for now.
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"],
}
