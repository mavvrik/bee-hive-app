import { prisma } from "./lib/prisma";

async function main() {
  const collectors =
    await prisma.collector.findMany({
      select: {
        id: true,
        name: true,
        preferredName: true,
        active: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  console.log("\n=== ALL COLLECTORS ===");
  console.table(collectors);

  const profiles =
    await prisma.employmentProfile.findMany({
      include: {
        collector: {
          select: {
            id: true,
            name: true,
            preferredName: true,
            active: true,
          },
        },
      },
    });

  console.log("\n=== EMPLOYMENT PROFILES ===");
  console.dir(profiles, {
    depth: null,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
