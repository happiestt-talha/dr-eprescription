import { PrismaClient } from "@prisma/client";

function getDatasourceUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    let modified = false;
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "15");
      modified = true;
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30");
      modified = true;
    }
    return modified ? parsed.toString() : url;
  } catch {
    return url;
  }
}

const globalForPrisma = globalThis;

const datasourceUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: {
              url: datasourceUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
