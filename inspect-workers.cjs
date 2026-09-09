const path = require("path");
const { PrismaPg } = require("@prisma/adapter-pg");

const {
  PrismaClient
} = require(
  path.join(
    process.cwd(),
    "app",
    "generated",
    "prisma",
    "client"
  )
);

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined."
  );
}

const adapter =
  new PrismaPg({
    connectionString,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

(async () => {
  const workers =
    await prisma.collector.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        preferredName: true,
        active: true,
      },
    });

  console.table(workers);

  await prisma.$disconnect();
})();
