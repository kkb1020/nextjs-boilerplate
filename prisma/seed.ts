import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
})

async function main() {
  const hashedPassword = await hash("password123", 12)
  const user = await db.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "test user",
      email: "test@example.com",
      hashedPassword,
    },
  })
  console.log("Seed complete:", user.email)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
