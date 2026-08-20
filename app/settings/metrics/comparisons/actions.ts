"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

function readText(
  formData: FormData,
  name: string,
) {
  const value =
    formData.get(name);

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function readInteger(
  formData: FormData,
  name: string,
  fallback = 0,
) {
  const value =
    Number.parseInt(
      readText(
        formData,
        name,
      ),
      10,
    );

  return Number.isFinite(
    value,
  )
    ? value
    : fallback;
}

function readFloat(
  formData: FormData,
  name: string,
  fallback = 0,
) {
  const value =
    Number.parseFloat(
      readText(
        formData,
        name,
      ),
    );

  return Number.isFinite(
    value,
  )
    ? value
    : fallback;
}

function refresh() {
  revalidatePath(
    "/settings/metrics/comparisons",
  );

  revalidatePath(
    "/",
  );
}

function createMetricKey(
  displayName: string,
) {
  return displayName
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

export async function createComparisonMetric(
  formData: FormData,
) {
  const displayName =
    readText(
      formData,
      "displayName",
    );

  if (
    !displayName
  ) {
    throw new Error(
      "Metric name is required.",
    );
  }

  let key =
    createMetricKey(
      displayName,
    );

  const existing =
    await prisma.dashboardMetric.findUnique({
      where: {
        key,
      },
    });

  if (
    existing
  ) {
    key =
      `${key}_${Date.now()}`;
  }

  const unit =
    readText(
      formData,
      "unit",
    );

  const decimalPlaces =
    Math.max(
      0,
      readInteger(
        formData,
        "decimalPlaces",
        1,
      ),
    );

  const improvementDirection =
    readText(
      formData,
      "improvementDirection",
    );

  const displayOrder =
    Math.max(
      0,
      readInteger(
        formData,
        "displayOrder",
        100,
      ),
    );

  await prisma.dashboardMetric.create({
    data: {
      key,

      displayName,

      description:
        null,

      unit:
        unit ||
        null,

      decimalPlaces,

      publicSource:
        "MANUAL",

      isVisible:
        true,

      displayOrder,

      comparisonEnabled:
        true,

      improvementDirection:
        improvementDirection ===
          "LOWER" ||
        improvementDirection ===
          "NEUTRAL"
          ? improvementDirection
          : "HIGHER",

      dataSourceKey:
        null,

      isBuiltIn:
        false,
    },
  });

  refresh();
}

export async function updateComparisonMetric(
  formData: FormData,
) {
  const metricId =
    readInteger(
      formData,
      "metricId",
    );

  if (
    metricId <= 0
  ) {
    throw new Error(
      "Metric is required.",
    );
  }

  const displayName =
    readText(
      formData,
      "displayName",
    );

  const unit =
    readText(
      formData,
      "unit",
    );

  const decimalPlaces =
    Math.max(
      0,
      readInteger(
        formData,
        "decimalPlaces",
        1,
      ),
    );

  const displayOrder =
    Math.max(
      0,
      readInteger(
        formData,
        "displayOrder",
        0,
      ),
    );

  const improvementDirection =
    readText(
      formData,
      "improvementDirection",
    );

  await prisma.dashboardMetric.update({
    where: {
      id:
        metricId,
    },

    data: {
      displayName,

      unit:
        unit ||
        null,

      decimalPlaces,

      displayOrder,

      improvementDirection:
        improvementDirection ===
          "LOWER" ||
        improvementDirection ===
          "NEUTRAL"
          ? improvementDirection
          : "HIGHER",
    },
  });

  refresh();
}

export async function toggleComparisonMetric(
  formData: FormData,
) {
  const metricId =
    readInteger(
      formData,
      "metricId",
    );

  const metric =
    await prisma.dashboardMetric.findUnique({
      where: {
        id:
          metricId,
      },
    });

  if (
    !metric
  ) {
    throw new Error(
      "Metric could not be found.",
    );
  }

  await prisma.dashboardMetric.update({
    where: {
      id:
        metric.id,
    },

    data: {
      isVisible:
        !metric.isVisible,
    },
  });

  refresh();
}

export async function saveDailyComparisonReading(
  formData: FormData,
) {
  const metricId =
    readInteger(
      formData,
      "metricId",
    );

  const value =
    readFloat(
      formData,
      "value",
    );

  const dateText =
    readText(
      formData,
      "entryDate",
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateText,
    )
  ) {
    throw new Error(
      "A valid date is required.",
    );
  }

  const metric =
    await prisma.dashboardMetric.findUnique({
      where: {
        id:
          metricId,
      },
    });

  if (
    !metric
  ) {
    throw new Error(
      "Metric could not be found.",
    );
  }

  /*
   * Derived HIVE metrics should not
   * receive duplicate manual entries.
   */

  if (
    metric.dataSourceKey
  ) {
    throw new Error(
      "This metric is automatically calculated by HIVE.",
    );
  }

  const recordedAt =
    new Date(
      `${dateText}T12:00:00`,
    );

  const dayStart =
    new Date(
      `${dateText}T00:00:00`,
    );

  const dayEnd =
    new Date(
      `${dateText}T23:59:59.999`,
    );

  /*
   * Keep one effective daily reading
   * per metric/source.
   */

  await prisma.metricReading.deleteMany({
    where: {
      metricId:
        metric.id,

      source:
        metric.publicSource,

      recordedAt: {
        gte:
          dayStart,

        lte:
          dayEnd,
      },
    },
  });

  await prisma.metricReading.create({
    data: {
      metricId:
        metric.id,

      source:
        metric.publicSource,

      value,

      recordedAt,
    },
  });

  refresh();
}