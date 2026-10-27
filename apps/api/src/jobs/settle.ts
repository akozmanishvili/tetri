import { prisma } from "../lib/prisma.js";
import { settlePendingOrders } from "../services/trading.js";

const { settled, waiting } = await settlePendingOrders();
console.log(`✓ Settled ${settled} order(s), ${waiting} still waiting for NAV`);

await prisma.$disconnect();
