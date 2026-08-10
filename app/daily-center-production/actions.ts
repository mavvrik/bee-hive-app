"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function readNumber(
  formData: FormData,
  fieldName: string,
) {
  const rawValue =
    formData.get(fieldName);

  if (
    typeof rawValue !== "string" ||
    rawValue.trim() === ""
  ) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  const value =
    Number(rawValue);

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be zero or greater.`,
    );
  }

  return value;
}

function readDate(
  formData: FormData,
  fieldName: string,
) {
  const rawValue =
    formData.get(fieldName);

  if (
    typeof rawValue !== "string" ||
    rawValue.trim() === ""
  ) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  const [year, month, day] =
    rawValue.split("-").map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      `${fieldName} is invalid.`,
    );
  }

  return new Date(
    year,
    month - 1,
    day,
  );
}

export async function saveDailyCenterProduction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const entryDate =
    readDate(
      formData,
      "entryDate",
    );

  const liters =
    readNumber(
      formData,
      "liters",
    );

  const donors =
    Math.round(
      readNumber(
        formData,
        "donors",
      ),
    );

  await prisma.dailyCenterProduction.upsert({
    where: {
      entryDate,
    },
    create: {
      entryDate,
      liters,
      donors,
    },
    update: {
      liters,
      donors,
    },
  });

  revalidatePath("/");
  revalidatePath(
    "/daily-center-production",
  );
  revalidatePath("/history");
}