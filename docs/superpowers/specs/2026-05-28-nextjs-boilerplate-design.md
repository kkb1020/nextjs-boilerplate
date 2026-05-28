# Next.js 보일러플레이트 디자인 스펙

**날짜**: 2026-05-28  
**목적**: 팀/조직 표준 템플릿 — 새 프로젝트 시작 시 반복 작업을 줄이고 첫날부터 비즈니스 로직에 집중할 수 있는 최소 구성 보일러플레이트

---

## 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 인증 | NextAuth.js (Auth.js v5) |
| DB | PostgreSQL |
| ORM | Prisma |
| UI | shadcn/ui + Tailwind CSS |
| API | Server Actions |
| 코드 품질 | ESLint + Prettier + Husky (pre-commit) |

---

## 폴더 구조

```
nextjs-boilerplate/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              ← shadcn/ui 컴포넌트 (직접 소유)
│   └── providers.tsx    ← SessionProvider, ThemeProvider 등
├── lib/
│   ├── auth.ts          ← NextAuth 설정 (authOptions export)
│   ├── db.ts            ← Prisma 클라이언트 싱글톤
│   └── utils.ts         ← cn() 등 공통 유틸
├── server/
│   └── actions/
│       ├── auth.ts      ← 로그인/회원가입 Server Actions
│       └── user.ts      ← 유저 관련 Server Actions
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts
├── .env.example
└── ...설정 파일들
```

**경계 원칙**: `lib/`는 순수 유틸/설정, `server/actions/`는 DB를 건드리는 서버 전용 코드. Server Actions을 `app/` 밖에 두는 이유는 여러 라우트에서 공유되기 때문.

---

## 핵심 연결

### NextAuth + Prisma

- `PrismaAdapter` 사용 — 세션/유저/계정 테이블 자동 관리
- `lib/auth.ts`에서 `authOptions` 중앙 관리
- 세션 접근 패턴: `getServerSession(authOptions)` (서버 컴포넌트/Server Actions)
- Prisma schema에 NextAuth 필수 모델 사전 포함

### Prisma 초기 스키마 모델

- `User` — `id`, `name`, `email`, `hashedPassword`, `emailVerified`, `image`, `createdAt`, `updatedAt`
- `Account` — NextAuth OAuth 계정 연결용
- `Session` — NextAuth 세션 관리
- `VerificationToken` — 이메일 인증 토큰

### 환경변수 (`.env.example`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 미리 만들어 두는 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 (로그인/회원가입 링크) |
| `/login` | 이메일/비밀번호 로그인 폼 |
| `/register` | 회원가입 폼 |
| `/dashboard` | 인증 보호된 페이지 (placeholder 콘텐츠) |

### 미들웨어

`middleware.ts` — `/dashboard/*` 경로에 대해 미인증 사용자를 `/login`으로 리다이렉트.

### shadcn/ui 초기 컴포넌트

로그인/회원가입 페이지에 필요한 최소 컴포넌트만 설치: `Button`, `Input`, `Card`, `Form`, `Label`, `Toast`

### 개발용 Seed

`prisma/seed.ts` — 개발 환경에서 `npm run db:seed`로 테스트 유저 1개 생성.

---

## 코드 품질 설정

- **ESLint**: Next.js 기본 규칙 + TypeScript 규칙
- **Prettier**: 포맷 통일
- **Husky + lint-staged**: pre-commit 훅에서 스테이징된 파일에만 `eslint --fix` + `prettier --write` 실행

---

## 스코프 외 (포함하지 않음)

- 소셜 로그인 (GitHub, Google 등) — 팀이 필요할 때 직접 추가
- 이메일 발송 (Resend, Nodemailer 등)
- 결제 (Stripe 등)
- 파일 업로드
- 국제화(i18n)
- 테스트 (Vitest, Playwright)

---

## 성공 기준

1. `git clone` → `npm install` → `.env` 설정 → `npm run dev` 로 즉시 실행 가능
2. 로그인/회원가입 → 세션 유지 → 대시보드 접근 흐름이 동작
3. 미인증 사용자가 `/dashboard` 접근 시 `/login`으로 리다이렉트
4. 팀원이 보일러플레이트 구조 파악 없이 `server/actions/`에 새 액션 추가 가능
