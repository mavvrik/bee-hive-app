"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const validSources = [
  "CSL",
  "HIVE",
  "MANUAL",
] as const;

type MetricSourceValue =
  (typeof validSources)[number];

function readRequiredText(
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

  return rawValue.trim();
}

function readOptionalText(
  formData: FormData,
  fieldName: string,
) {
  const rawValue = formData.get(fieldName);

  if (
    typeof rawValue !== "string" ||
    rawValue.trim() === ""
  ) {
    return null;
  }

  return rawValue.trim();
}

function readNonNegativeNumber(
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

function readWholeNumber(
  formData: FormData,
  fieldName: string,
) {
  return Math.round(
    readNonNegativeNumber(
      formData,
      fieldName,
    ),
  );
}

function readSource(
  formData: FormData,
  fieldName: string,
): MetricSourceValue {
  const source = readRequiredText(
    formData,
    fieldName,
  );

  if (
    !validSources.includes(
      source as MetricSourceValue,
    )
  ) {
    throw new Error(
      `${fieldName} is invalid.`,
    );
  }

  return source as MetricSourceValue;
}

function createMetricKey(
  displayName: string,
) {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function revalidateMetricPages() {
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/settings/hive");
  revalidatePath("/settings/analytics");
}

export async function createDashboardMetric(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const displayName = readRequiredText(
    formData,
    "displayName",
  );

  const submittedKey = readOptionalText(
    formData,
    "key",
  );

  const key =
    submittedKey?.toLowerCase() ??
    createMetricKey(displayName);

  if (!key) {
    throw new Error(
      "A valid metric key could not be created.",
    );
  }

  const description = readOptionalText(
    formData,
    "description",
  );

  const unit = readOptionalText(
    formData,
    "unit",
  );

  const decimalPlaces = readWholeNumber(
    formData,
    "decimalPlaces",
  );

  const displayOrder = readWholeNumber(
    formData,
    "displayOrder",
  );

  const publicSource = readSource(
    formData,
    "publicSource",
  );

  const isVisible =
    formData.get("isVisible") === "on";

  if (decimalPlaces > 6) {
    throw new Error(
      "Decimal places cannot exceed 6.",
    );
  }

  await prisma.dashboardMetric.create({
    data: {
      key,
      displayName,
      description,
      unit,
      decimalPlaces,
      publicSource,
      isVisible,
      displayOrder,
    },
  });

  revalidateMetricPages();
}

export async function addMetricReading(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const metricId = readWholeNumber(
    formData,
    "metricId",
  );

  const source = readSource(
    formData,
    "source",
  );

  const value = readNonNegativeNumber(
    formData,
    "value",
  );

  const metric =
    await prisma.dashboardMetric.findUnique({
      where: {
        id: metricId,
      },
      select: {
        id: true,
      },
    });

  if (!metric) {
    throw new Error(
      "The selected metric was not found.",
    );
  }

  await prisma.metricReading.create({
    data: {
      metricId,
      source,
      value,
    },
  });

  revalidateMetricPages();
}

export async function updateMetricVisibility(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const metricId = readWholeNumber(
    formData,
    "metricId",
  );

  const isVisible =
    formData.get("isVisible") === "on";

  await prisma.dashboardMetric.update({
    where: {
      id: metricId,
    },
    data: {
      isVisible,
    },
  });

  revalidateMetricPages();
}