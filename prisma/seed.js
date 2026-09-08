const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@clinic.com" },
    update: {},
    create: {
      email: "admin@clinic.com",
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log("Seeded admin: admin@clinic.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());