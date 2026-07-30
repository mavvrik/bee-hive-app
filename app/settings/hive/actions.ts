"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function readNumber(
  formData: FormData,
  fieldName: string,
) {
  const rawValue = formData.get(fieldName);

  if (
    typeof rawValue !== "string" ||
    rawValue.trim() === ""
  ) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${fieldName} must be zero or greater.`,
    );
  }

  return value;
}

export async function updateHiveMetrics(
  formData: FormData,
) {
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

  await prisma.hiveSettings.update({
    where: { id: 1 },
    data: {
      donorFrequency,
      theoreticalYield,
      uniqueDonorCount,
      dashboardRotationSeconds,
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/settings/hive");
}
