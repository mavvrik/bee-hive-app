"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

function readText(
  formData: FormData,
  fieldName: string,
) {
  const value =
    formData.get(
      fieldName,
    );

  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function readFloat(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value =
    Number.parseFloat(
      readText(
        formData,
        fieldName,
      ),
    );

  return Number.isFinite(
    value,
  )
    ? value
    : fallback;
}

function readInteger(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value =
    Number.parseInt(
      readText(
        formData,
        fieldName,
      ),
      10,
    );

  return Number.isFinite(
    value,
  )
    ? value
    : fallback;
}

/*
 * ==========================================
 * OFFICIAL HIVE DAILY DATE
 * ==========================================
 *
 * Every operational date is stored at:
 *
 * YYYY-MM-DDT00:00:00.000Z
 *
 * This matches WorkerStickEntry and prevents
 * duplicate calendar dates caused by timezone
 * differences.
 * ==========================================
 */

function parseEntryDate(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "A valid production date is required.",
    );
  }

  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function refreshProductionPages() {
  revalidatePath(
    "/",
  );

  revalidatePath(
    "/daily-center-production",
  );

  revalidatePath(
    "/history",
  );

  revalidatePath(
    "/settings/metrics/comparisons",
  );
}

export async function saveDailyCenterProduction(
  formData: FormData,
) {
  const dateText =
    readText(
      formData,
      "entryDate",
    );

  const entryDate =
    parseEntryDate(
      dateText,
    );

  const liters =
    Math.max(
      0,
      readFloat(
        formData,
        "liters",
        0,
      ),
    );

  const donors =
    Math.max(
      0,
      readInteger(
        formData,
        "donors",
        0,
      ),
    );

  /*
   * ==========================================
   * ONE DATE = ONE AUTHORITATIVE VALUE
   * ==========================================
   *
   * Saving Aug 12 as 188:
   *
   * Aug 12 = 188
   *
   * Saving Aug 12 again as 190:
   *
   * Aug 12 = 190
   *
   * NOT 378.
   *
   * Saving Aug 12 as 0:
   *
   * Aug 12 = 0.
   * ==========================================
   */

  await prisma.dailyCenterProduction.upsert({
    where: {
      entryDate,
    },

    update: {
      liters,
      donors,
    },

    create: {
      entryDate,
      liters,
      donors,
    },
  });

  refreshProductionPages();
}