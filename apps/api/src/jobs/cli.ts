import { prisma } from "../lib/prisma.js";
import { runDailyJobs } from "./daily.js";

try {
  await runDailyJobs();
} finally {
  await prisma.$disconnect();
}
