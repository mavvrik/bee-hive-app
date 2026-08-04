"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  DEFAULT_KPI_DEFINITIONS,
  KPI_KEYS,
} from "@/app/lib/kpiDefinitions";

function readNumber(
  formData: FormData,
  fieldName: string,
): number {
  const rawValue = formData.get(fieldName);

  if (
    typeof rawValue !== "string" ||
    rawValue.trim() === ""
  ) {
    throw new Error(`${fieldName} is required.`);
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${fieldName} must be zero or greater.`,
    );
  }

  return value;
}

function getDefinition(key: string) {
  const definition =
    DEFAULT_KPI_DEFINITIONS.find(
      (item) => item.key === key,
    );

  if (!definition) {
    throw new Error(
      `KPI definition "${key}" was not found.`,
    );
  }

  return definition;
}

export async function updateHiveMetrics(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const donorFrequency = readNumber(
    formData,
    "donorFrequency",
  );

  const theoreticalYield = readNumber(
    formData,
    "theoreticalYield",
  );

  const uniqueDonorCount = Math.round(
    readNumber(
      formData,
      "uniqueDonorCount",
    ),
  );

  const dashboardRotationSeconds =
    Math.round(
      readNumber(
        formData,
        "dashboardRotationSeconds",
      ),
    );

  if (theoreticalYield > 100) {
    throw new Error(
      "Theoretical yield cannot exceed 100%.",
    );
  }

  if (dashboardRotationSeconds < 30) {
    throw new Error(
      "Dashboard rotation must be at least 30 seconds.",
    );
  }

  const submittedMetrics = [
    {
      key: KPI_KEYS.donorFrequency,
      value: donorFrequency,
    },
    {
      key: KPI_KEYS.theoreticalYield,
      value: theoreticalYield,
    },
    {
      key: KPI_KEYS.uniqueDonorCount,
      value: uniqueDonorCount,
    },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.hiveSettings.update({
      where: { id: 1 },
      data: {
        dashboardRotationSeconds,
      },
    });

    for (const submittedMetric of submittedMetrics) {
      const definition = getDefinition(
        submittedMetric.key,
      );

      const metric =
        await tx.dashboardMetric.upsert({
          where: {
            key: definition.key,
          },
          create: {
            key: definition.key,
            displayName:
              definition.displayName,
            description:
              definition.description,
            unit: definition.unit,
            decimalPlaces:
              definition.decimalPlaces,
            publicSource:
              definition.publicSource,
            isVisible:
              definition.isVisible,
            displayOrder:
              definition.displayOrder,
          },
          update: {
            displayName:
              definition.displayName,
            description:
              definition.description,
            unit: definition.unit,
            decimalPlaces:
              definition.decimalPlaces,
            isVisible:
              definition.isVisible,
            displayOrder:
              definition.displayOrder,
          },
        });

      await tx.metricReading.create({
        data: {
          metricId: metric.id,
          source: "CSL",
          value: submittedMetric.value,
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/settings/hive");
}