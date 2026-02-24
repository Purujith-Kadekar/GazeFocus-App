import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding...");

  const passwordHash = await bcrypt.hash("password123", 10);
  const email = "test@example.com";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Test User",
      passwordHash,
    },
  });

  console.log(`User created or found: ${user.email}`);

  // Create a default root folder
  const folder = await prisma.folder.upsert({
    where: {
      id: "seed-root-folder", // Using a fixed ID for seed stability
    },
    update: {},
    create: {
      id: "seed-root-folder",
      userId: user.id,
      title: "My Videos",
      position: 0,
    },
  });

  console.log(`Root folder created: ${folder.title}`);

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
