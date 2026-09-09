import { prisma } from "./lib/prisma";

async function main() {
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
