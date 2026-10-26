import { afterAll, beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";

// every test starts with zero users.
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
