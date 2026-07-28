"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type DailyProductionEntry = {
  collectorId: number;
  liters: number;
};

export async function saveDailyProduction(
  entries: DailyProductionEntry[],
) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("No production entries were provided.");
  }

  const entryDate = new Date();

  entryDate.setHours(0, 0, 0, 0);

  const validEntries = entries.filter((entry) => {
    return (
      Number.isInteger(entry.collectorId) &&
      entry.collectorId > 0 &&
      Number.isFinite(entry.liters) &&
      entry.liters >= 0
    );
  });

  if (validEntries.length !== entries.length) {
    throw new Error("One or more production entries are invalid.");
  }

  await prisma.$transaction(
    validEntries.map((entry) =>
      prisma.dailyEntry.upsert({
        where: {
          collectorId_entryDate: {
            collectorId: entry.collectorId,
            entryDate,
          },
        },
        update: {
          liters: entry.liters,
        },
        create: {
          collectorId: entry.collectorId,
          entryDate,
          liters: entry.liters,
        },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/daily-entry");

  return {
    success: true,
    savedCount: validEntries.length,
  };
}