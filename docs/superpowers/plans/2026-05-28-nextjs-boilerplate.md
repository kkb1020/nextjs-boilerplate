# Next.js 보일러플레이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 팀/조직 표준으로 쓸 수 있는 최소 구성의 Next.js 보일러플레이트를 처음부터 구축한다.

**Architecture:** `create-next-app`으로 기반을 만든 뒤, Prisma + NextAuth(Auth.js v5) + shadcn/ui를 레이어링한다. Server Actions를 API 레이어로 사용하고, `lib/`는 순수 설정, `server/actions/`는 DB를 건드리는 서버 전용 코드로 경계를 분리한다.

**Tech Stack:** Next.js 15, Auth.js (next-auth v5), Prisma, PostgreSQL, shadcn/ui, Tailwind CSS, ESLint, Prettier, Husky

---

## 파일 맵

| 작업 | 파일 |
|------|------|
| 생성 (scaffold) | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/globals.css` |
| 생성 | `prisma/schema.prisma`, `prisma/seed.ts` |
| 생성 | `lib/db.ts`, `lib/auth.ts`, `lib/utils.ts` |
| 생성 | `app/api/auth/[...nextauth]/route.ts` |
| 생성 | `middleware.ts` |
| 생성 | `components/providers.tsx` |
| 생성 | `components/ui/*` (shadcn/ui) |
| 생성 | `server/actions/auth.ts` |
| 수정 | `app/layout.tsx` |
| 생성 | `app/page.tsx` |
| 생성 | `app/(auth)/login/page.tsx` |
| 생성 | `app/(auth)/register/page.tsx` |
| 생성 | `app/(dashboard)/dashboard/page.tsx` |
| 생성 | `.env.example`, `.prettierrc`, `.husky/pre-commit` |
| 수정 | `package.json` (scripts, lint-staged) |

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: create-next-app 실행**

현재 디렉터리(`D:\work\0528_multi_agent\nextjs-boilerplate`)에서 실행한다.

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*" --no-git
```

인터랙티브 프롬프트가 뜨면:
- `src/` directory? → **No**
- Turbopack? → **No**
- import alias 커스터마이즈? → **No** (기본값 `@/*` 사용)

- [ ] **Step 2: 서버 기동 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열었을 때 Next.js 기본 페이지가 보이면 성공.
`Ctrl+C`로 종료.

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project"
```

---

## Task 2: 추가 의존성 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 런타임 의존성 설치**

```bash
npm install next-auth@beta @auth/prisma-adapter prisma @prisma/client bcryptjs
```

- [ ] **Step 2: 개발 의존성 설치**

```bash
npm install -D @types/bcryptjs prettier lint-staged
```

- [ ] **Step 3: 설치 확인**

```bash
npm ls next-auth @auth/prisma-adapter prisma bcryptjs
```

에러 없이 버전이 출력되면 성공.

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: install auth, prisma, and bcryptjs dependencies"
```

---

## Task 3: Prisma 설정 — 스키마 + DB 클라이언트

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`
- Modify: `.env` (생성됨)

- [ ] **Step 1: Prisma 초기화**

```bash
npx prisma init --datasource-provider postgresql
```

실행 후 `prisma/schema.prisma`와 `.env`가 생성된다.

- [ ] **Step 2: `.gitignore`에 `.env` 확인**

`create-next-app`이 `.gitignore`를 만들었을 때 `.env`가 이미 포함되어 있다. 없으면 추가한다.

```bash
# .gitignore 확인
grep "\.env" .gitignore
```

`.env`가 없으면 `.gitignore` 마지막 줄에 다음을 추가한다.
```
.env
```

- [ ] **Step 3: `prisma/schema.prisma` 작성**

`prisma/schema.prisma`를 아래 내용으로 교체한다.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  name           String?
  email          String    @unique
  emailVerified  DateTime?
  image          String?
  hashedPassword String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}
```

- [ ] **Step 4: `lib/db.ts` 작성**

`lib/db.ts` 파일을 생성한다.

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

에러가 없으면 성공. (Prisma Client는 아직 generate 전이므로 `@prisma/client` 관련 에러가 나면 Task 12에서 해결된다 — 지금은 무시.)

- [ ] **Step 6: 커밋**

```bash
git add prisma/schema.prisma lib/db.ts .gitignore
git commit -m "feat: add Prisma schema and db client singleton"
```

---

## Task 4: NextAuth (Auth.js v5) 설정

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: `lib/auth.ts` 작성**

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.hashedPassword) return null

        const isValid = await compare(
          credentials.password as string,
          user.hashedPassword
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
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
```

- [ ] **Step 2: `app/api/auth/[...nextauth]/route.ts` 작성**

디렉터리를 먼저 만든다.

```bash
mkdir -p app/api/auth/\[...nextauth\]
```

(Windows PowerShell에서는)
```powershell
New-Item -ItemType Directory -Force "app/api/auth/[...nextauth]"
```

파일 내용:

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

- [ ] **Step 3: 커밋**

```bash
git add lib/auth.ts "app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: configure NextAuth with Credentials provider and Prisma adapter"
```

---

## Task 5: 미들웨어 — 라우트 보호

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: `middleware.ts` 작성**

프로젝트 루트에 `middleware.ts`를 생성한다.

```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

- [ ] **Step 2: 커밋**

```bash
git add middleware.ts
git commit -m "feat: protect /dashboard routes with auth middleware"
```

---

## Task 6: shadcn/ui 초기화 및 컴포넌트 설치

**Files:**
- Create: `components/ui/*`, `components.json`
- Modify: `tailwind.config.ts`, `app/globals.css`, `lib/utils.ts`

- [ ] **Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init -d
```

`-d` 플래그는 기본값(New York 스타일, CSS variables 사용)으로 설정한다. 프롬프트가 뜨면:
- Style: **New York**
- Base color: **Neutral**
- CSS variables: **Yes**

`components.json`이 생성되고 `tailwind.config.ts`와 `globals.css`가 업데이트된다.

- [ ] **Step 2: 필수 컴포넌트 추가**

```bash
npx shadcn@latest add button input card label sonner
```

프롬프트에서 모두 `y`로 확인한다.

- [ ] **Step 3: `lib/utils.ts` 확인**

shadcn/ui init이 `lib/utils.ts`를 자동 생성한다. 내용이 아래와 같은지 확인한다.

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

없거나 다르면 직접 위 내용으로 작성한다.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with Button, Input, Card, Label, Sonner"
```

---

## Task 7: Providers 컴포넌트

**Files:**
- Create: `components/providers.tsx`

- [ ] **Step 1: `components/providers.tsx` 작성**

```typescript
"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/providers.tsx
git commit -m "feat: add SessionProvider wrapper component"
```

---

## Task 8: Server Actions — 인증 로직

**Files:**
- Create: `server/actions/auth.ts`

- [ ] **Step 1: 디렉터리 생성**

```bash
mkdir -p server/actions
```

(Windows PowerShell)
```powershell
New-Item -ItemType Directory -Force "server/actions"
```

- [ ] **Step 2: `server/actions/auth.ts` 작성**

```typescript
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
```

- [ ] **Step 3: 커밋**

```bash
git add server/actions/auth.ts
git commit -m "feat: add login, register, logout server actions"
```

---

## Task 9: 페이지 구현

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: `app/layout.tsx` 교체**

create-next-app이 만든 기본 layout.tsx를 아래 내용으로 교체한다.

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Next.js Boilerplate",
  description: "팀 표준 Next.js 보일러플레이트",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: `app/page.tsx` 교체**

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Next.js 보일러플레이트</h1>
      <p className="text-muted-foreground">팀 표준 템플릿입니다. 바로 시작하세요.</p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">로그인</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">회원가입</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `app/(auth)/login/page.tsx` 생성**

디렉터리 생성:
```powershell
New-Item -ItemType Directory -Force "app/(auth)/login"
```

파일 내용:

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { login } from "@/server/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const result = await login(
      form.get("email") as string,
      form.get("password") as string
    )
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>이메일과 비밀번호로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/register" className="text-primary underline">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: `app/(auth)/register/page.tsx` 생성**

디렉터리 생성:
```powershell
New-Item -ItemType Directory -Force "app/(auth)/register"
```

파일 내용:

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { register } from "@/server/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const result = await register(
      form.get("name") as string,
      form.get("email") as string,
      form.get("password") as string
    )
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>새 계정을 만드세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "처리 중..." : "회원가입"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: `app/(dashboard)/dashboard/page.tsx` 생성**

디렉터리 생성:
```powershell
New-Item -ItemType Directory -Force "app/(dashboard)/dashboard"
```

파일 내용:

```typescript
import { auth } from "@/lib/auth"
import { logout } from "@/server/actions/auth"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground">
        안녕하세요, {session?.user?.name ?? session?.user?.email}님
      </p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          로그아웃
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: 커밋**

```bash
git add app/
git commit -m "feat: add landing, login, register, and dashboard pages"
```

---

## Task 10: Prettier + Husky + lint-staged 설정

**Files:**
- Create: `.prettierrc`, `.prettierignore`, `.husky/pre-commit`
- Modify: `package.json`

- [ ] **Step 1: `.prettierrc` 생성**

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 2: `.prettierignore` 생성**

```
.next
node_modules
public
*.lock
```

- [ ] **Step 3: Husky 초기화**

```bash
npx husky init
```

`.husky/pre-commit` 파일이 생성된다.

- [ ] **Step 4: `.husky/pre-commit` 내용 교체**

생성된 `.husky/pre-commit`의 내용을 아래로 교체한다.

```bash
npx lint-staged
```

- [ ] **Step 5: `package.json`에 lint-staged 설정 추가**

`package.json`의 최상위에 다음 키를 추가한다 (기존 `scripts`, `dependencies` 등과 같은 레벨).

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,css,md}": [
    "prettier --write"
  ]
}
```

- [ ] **Step 6: 동작 확인**

아무 `.ts` 파일을 스테이징하고 커밋을 시도해서 lint-staged가 실행되는지 확인한다.

```bash
git add .prettierrc .prettierignore .husky/ package.json
git commit -m "chore: configure Prettier, Husky pre-commit hook, and lint-staged"
```

---

## Task 11: Seed 스크립트 + 환경변수 템플릿 + npm scripts

**Files:**
- Create: `prisma/seed.ts`, `.env.example`
- Modify: `package.json`

- [ ] **Step 1: `prisma/seed.ts` 작성**

```typescript
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const hashedPassword = await hash("password123", 12)
  const user = await db.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "테스트 유저",
      email: "test@example.com",
      hashedPassword,
    },
  })
  console.log("Seed 완료:", user.email)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
```

- [ ] **Step 2: `.env.example` 생성**

```
# 데이터베이스
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mydb"

# NextAuth
NEXTAUTH_SECRET="your-secret-here-run-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 3: `package.json` scripts 업데이트**

`package.json`의 `"scripts"` 섹션에 다음 항목을 추가한다.

```json
"db:push": "prisma db push",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts",
"db:studio": "prisma studio",
"db:generate": "prisma generate"
```

- [ ] **Step 4: tsx 설치** (`seed.ts` 실행용)

```bash
npm install -D tsx
```

- [ ] **Step 5: `package.json`에 prisma seed 설정 추가**

`package.json` 최상위에 추가한다.

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 6: 커밋**

```bash
git add prisma/seed.ts .env.example package.json package-lock.json
git commit -m "feat: add seed script, env template, and db helper scripts"
```

---

## Task 12: DB 마이그레이션 + 최종 검증

**Files:**
- Create: `prisma/migrations/` (자동 생성)

- [ ] **Step 1: `.env` 설정**

`.env` 파일에 실제 DB 접속 정보를 입력한다.

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mydb"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

`NEXTAUTH_SECRET` 생성:
```bash
openssl rand -base64 32
```

- [ ] **Step 2: Prisma Client 생성**

```bash
npx prisma generate
```

`✔ Generated Prisma Client` 출력이 나오면 성공.

- [ ] **Step 3: DB 마이그레이션**

```bash
npx prisma migrate dev --name init
```

`✔ Your database is now in sync with your schema.` 출력이 나오면 성공.

- [ ] **Step 4: 시드 실행**

```bash
npm run db:seed
```

`Seed 완료: test@example.com` 출력이 나오면 성공.

- [ ] **Step 5: 개발 서버 기동 및 전체 흐름 검증**

```bash
npm run dev
```

다음 시나리오를 순서대로 검증한다:

1. `http://localhost:3000` 접속 → 랜딩 페이지 확인
2. `/dashboard` 직접 접속 → `/login`으로 리다이렉트 되는지 확인
3. `/login` 에서 `test@example.com` / `password123` 로그인 → `/dashboard` 진입 확인
4. 대시보드에서 "안녕하세요, 테스트 유저님" 표시 확인
5. "로그아웃" 클릭 → `/` 리다이렉트 확인
6. `/register` 에서 새 계정 생성 → `/dashboard` 진입 확인

- [ ] **Step 6: TypeScript 타입 검사**

```bash
npx tsc --noEmit
```

에러가 없으면 성공.

- [ ] **Step 7: 마이그레이션 파일 커밋**

```bash
git add prisma/migrations/
git commit -m "feat: add initial database migration"
```

- [ ] **Step 8: 최종 커밋**

```bash
git add -A
git commit -m "chore: finalize boilerplate setup and verification"
```

---

## 완료 기준 체크리스트

- [ ] `npm run dev` 실행 후 `localhost:3000` 접속 가능
- [ ] 미인증 사용자가 `/dashboard` 접근 시 `/login`으로 리다이렉트
- [ ] 로그인 → 세션 유지 → 대시보드 접근 흐름 동작
- [ ] 회원가입 → 자동 로그인 → 대시보드 동작
- [ ] 로그아웃 → 랜딩 페이지 리다이렉트
- [ ] `npx tsc --noEmit` 에러 없음
- [ ] pre-commit 훅 실행 확인
