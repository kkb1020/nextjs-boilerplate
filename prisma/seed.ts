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
