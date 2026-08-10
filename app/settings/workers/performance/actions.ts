"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function readInteger(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return 0;
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    );

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
}

function readDate(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      "Performance date is invalid.",
    );
  }

  return new Date(
    year,
    month - 1,
    day,
  );
}

export async function saveWorkerStickPerformance(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const entryDate =
    readDate(
      formData,
      "entryDate",
    );

  const collectorIds =
    formData
      .getAll("collectorId")
      .map((value) =>
        Number(value),
      )
      .filter((value) =>
        Number.isInteger(value),
      );

  await prisma.$transaction(
    collectorIds.map(
      (collectorId) => {
        const totalSticks =
          readInteger(
            formData,
            `totalSticks-${collectorId}`,
          );

        const successfulSticks =
          readInteger(
            formData,
            `successfulSticks-${collectorId}`,
          );

        if (
          successfulSticks >
          totalSticks
        ) {
          throw new Error(
            "Successful sticks cannot exceed total sticks.",
          );
        }

        return prisma.workerStickEntry.upsert({
          where: {
            collectorId_entryDate: {
              collectorId,
              entryDate,
            },
          },

          create: {
            collectorId,
            entryDate,
            totalSticks,
            successfulSticks,
          },

          update: {
            totalSticks,
            successfulSticks,
          },
        });
      },
    ),
  );

  revalidatePath(
    "/settings/workers/performance",
  );

  revalidatePath(
    "/settings/workers",
  );

  revalidatePath("/");
}