"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function readCollectorId(
  formData: FormData,
) {
  const value =
    formData.get("collectorId");

  if (
    typeof value !== "string"
  ) {
    return 0;
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function refreshRecognition() {
  revalidatePath("/");
  revalidatePath(
    "/settings/workers",
  );
  revalidatePath(
    "/settings/workers/employee-of-month",
  );
}

export async function selectEmployeeOfMonth(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const collectorId =
    readCollectorId(
      formData,
    );

  if (collectorId <= 0) {
    throw new Error(
      "A valid Worker Bee is required.",
    );
  }

  const collector =
    await prisma.collector.findUnique({
      where: {
        id: collectorId,
      },

      select: {
        id: true,
        active: true,
      },
    });

  if (
    !collector ||
    !collector.active
  ) {
    throw new Error(
      "The selected Worker Bee is not active.",
    );
  }

  await prisma.$transaction([
    prisma.collector.updateMany({
      where: {
        isEmployeeOfMonth:
          true,
      },

      data: {
        isEmployeeOfMonth:
          false,
      },
    }),

    prisma.collector.update({
      where: {
        id: collectorId,
      },

      data: {
        isEmployeeOfMonth:
          true,
      },
    }),
  ]);

  refreshRecognition();

  redirect(
    "/settings/workers/employee-of-month?saved=1",
  );
}

export async function clearEmployeeOfMonth(): Promise<void> {
  await requireAdmin();

  await prisma.collector.updateMany({
    where: {
      isEmployeeOfMonth:
        true,
    },

    data: {
      isEmployeeOfMonth:
        false,
    },
  });

  refreshRecognition();

  redirect(
    "/settings/workers/employee-of-month?cleared=1",
  );
}