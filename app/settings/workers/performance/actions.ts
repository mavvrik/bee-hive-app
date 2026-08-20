"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ROLE_TO_ENUM: Record<string, string> = {
  Management: "MANAGEMENT",
  Phlebotomist: "PHLEBOTOMIST",
  "Group Lead": "GROUP_LEAD",
  Processor: "PROCESSOR",
  "Reception Tech": "RECEPTION_TECH",
  MSA: "MSA",
  DST: "DST",
  Other: "OTHER",
};

function readInteger(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return fallback;
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function readText(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(fieldName);

  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function parseEntryDate(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "A valid performance date is required.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function getPrimaryRoleEnum(
  role: string,
) {
  return (
    ROLE_TO_ENUM[role] ??
    "OTHER"
  );
}

export async function saveDailyWorkerPerformance(
  formData: FormData,
) {
  const collectorId =
    readInteger(
      formData,
      "collectorId",
    );

  if (collectorId <= 0) {
    throw new Error(
      "A valid Worker Bee is required.",
    );
  }

  const dateString =
    readText(
      formData,
      "entryDate",
    );

  const entryDate =
    parseEntryDate(
      dateString,
    );

  const collector =
    await prisma.collector.findUnique({
      where: {
        id: collectorId,
      },

      include: {
        roleAssignments:
          true,
      },
    });

  if (!collector) {
    throw new Error(
      "Worker Bee could not be found.",
    );
  }

  const roleSet =
    new Set<string>();

  for (
    const assignment of
      collector.roleAssignments
  ) {
    roleSet.add(
      assignment.role,
    );
  }

  // Legacy / safety:
  // Primary role is always considered eligible.
  roleSet.add(
    getPrimaryRoleEnum(
      collector.role,
    ),
  );

  const totalSticks =
    Math.max(
      0,
      readInteger(
        formData,
        "totalSticks",
        0,
      ),
    );

  const successfulSticks =
    Math.max(
      0,
      readInteger(
        formData,
        "successfulSticks",
        0,
      ),
    );

  const physicals =
    Math.max(
      0,
      readInteger(
        formData,
        "physicals",
        0,
      ),
    );

  const interviews =
    Math.max(
      0,
      readInteger(
        formData,
        "interviews",
        0,
      ),
    );

  const setups =
    Math.max(
      0,
      readInteger(
        formData,
        "setups",
        0,
      ),
    );

  const disconnects =
    Math.max(
      0,
      readInteger(
        formData,
        "disconnects",
        0,
      ),
    );

  const processed =
    Math.max(
      0,
      readInteger(
        formData,
        "processed",
        0,
      ),
    );

  const emfCount =
    Math.max(
      0,
      readInteger(
        formData,
        "emfCount",
        0,
      ),
    );

  const emfNote =
    readText(
      formData,
      "emfNote",
    );

  if (
    successfulSticks >
    totalSticks
  ) {
    throw new Error(
      "Successful sticks cannot exceed total sticks.",
    );
  }

  await prisma.$transaction(
    async (tx) => {
      /*
       * ==========================================
       * PHLEBOTOMY
       * ==========================================
       */

      if (
        roleSet.has(
          "PHLEBOTOMIST",
        )
      ) {
        await tx.workerStickEntry.upsert({
          where: {
            collectorId_entryDate: {
              collectorId,
              entryDate,
            },
          },

          update: {
            totalSticks,
            successfulSticks,
          },

          create: {
            collectorId,
            entryDate,
            totalSticks,
            successfulSticks,
          },
        });
      }

      /*
       * ==========================================
       * MSA
       * ==========================================
       */

      if (
        roleSet.has("MSA")
      ) {
        await tx.workerPerformanceEntry.upsert({
          where: {
            collectorId_entryDate_role_metric: {
              collectorId,
              entryDate,
              role: "MSA",
              metric:
                "PHYSICALS",
            },
          },

          update: {
            totalCount:
              physicals,
          },

          create: {
            collectorId,
            entryDate,
            role: "MSA",
            metric:
              "PHYSICALS",
            totalCount:
              physicals,
          },
        });
      }

      /*
       * ==========================================
       * RECEPTION TECH
       * ==========================================
       */

      if (
        roleSet.has(
          "RECEPTION_TECH",
        )
      ) {
        await tx.workerPerformanceEntry.upsert({
          where: {
            collectorId_entryDate_role_metric: {
              collectorId,
              entryDate,
              role:
                "RECEPTION_TECH",
              metric:
                "INTERVIEWS",
            },
          },

          update: {
            totalCount:
              interviews,
          },

          create: {
            collectorId,
            entryDate,
            role:
              "RECEPTION_TECH",
            metric:
              "INTERVIEWS",
            totalCount:
              interviews,
          },
        });
      }

      /*
       * ==========================================
       * DST — SETUPS
       * ==========================================
       */

      if (
        roleSet.has("DST")
      ) {
        await tx.workerPerformanceEntry.upsert({
          where: {
            collectorId_entryDate_role_metric: {
              collectorId,
              entryDate,
              role: "DST",
              metric:
                "SETUPS",
            },
          },

          update: {
            totalCount:
              setups,
          },

          create: {
            collectorId,
            entryDate,
            role: "DST",
            metric:
              "SETUPS",
            totalCount:
              setups,
          },
        });

        /*
         * ==========================================
         * DST — DISCONNECTS
         * ==========================================
         */

        await tx.workerPerformanceEntry.upsert({
          where: {
            collectorId_entryDate_role_metric: {
              collectorId,
              entryDate,
              role: "DST",
              metric:
                "DISCONNECTS",
            },
          },

          update: {
            totalCount:
              disconnects,
          },

          create: {
            collectorId,
            entryDate,
            role: "DST",
            metric:
              "DISCONNECTS",
            totalCount:
              disconnects,
          },
        });
      }

      /*
       * ==========================================
       * PROCESSOR
       * ==========================================
       */

      if (
        roleSet.has(
          "PROCESSOR",
        )
      ) {
        await tx.workerPerformanceEntry.upsert({
          where: {
            collectorId_entryDate_role_metric: {
              collectorId,
              entryDate,
              role:
                "PROCESSOR",
              metric:
                "PROCESSED",
            },
          },

          update: {
            totalCount:
              processed,
          },

          create: {
            collectorId,
            entryDate,
            role:
              "PROCESSOR",
            metric:
              "PROCESSED",
            totalCount:
              processed,
          },
        });
      }

      /*
       * ==========================================
       * EMF / QUALITY
       *
       * One consolidated EMF entry per worker/day.
       * ==========================================
       */

      await tx.qualityEmfEntry.deleteMany({
        where: {
          collectorId,
          entryDate,
        },
      });

      if (emfCount > 0) {
        await tx.qualityEmfEntry.create({
          data: {
            collectorId,
            entryDate,
            emfCount,
            note:
              emfNote ||
              null,
          },
        });
      }
    },
  );

  revalidatePath(
    "/",
  );

  revalidatePath(
    "/settings/workers",
  );

  revalidatePath(
    "/settings/workers/performance",
  );
}