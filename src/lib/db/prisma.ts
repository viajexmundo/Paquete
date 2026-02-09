import { PrismaClient } from "@prisma/client";

// In dev with Turbopack, a globally cached PrismaClient can stay stale after schema changes.
// Creating a fresh client per server boot avoids "Unknown field" validation drift.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
