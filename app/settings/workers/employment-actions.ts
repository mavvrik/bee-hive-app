"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function numberField(
  formData: FormData,
  key: string,
  fallback: number,
) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function saveCompactEmploymentProfile(
  formData: FormData,
) {
  await requireAdmin();

  const collectorId = Number(formData.get("collectorId"));

  if (!Number.isInteger(collectorId) || collectorId <= 0) {
    throw new Error("A valid Worker Bee is required.");
  }

  const rawEmploymentType = String(
    formData.get("employmentType") ?? "",
  );

  const rawSchedulePattern = String(
    formData.get("schedulePattern") ?? "",
  );

  if (!["FTE", "PTE"].includes(rawEmploymentType)) {
    throw new Error("Invalid employment type.");
  }

  if (
    !["STANDARD_8", "FOUR_TENS"].includes(
      rawSchedulePattern,
    )
  ) {
    throw new Error("Invalid schedule pattern.");
  }

  const employmentType = rawEmploymentType as
    | "FTE"
    | "PTE";

  const schedulePattern = rawSchedulePattern as
    | "STANDARD_8"
    | "FOUR_TENS";

  const defaultMin =
    employmentType === "FTE" ? 37 : 0;

  const defaultMax =
    employmentType === "FTE" ? 40 : 29;

  const defaultTarget =
    employmentType === "FTE" ? 40 : 29;

  const defaultShift =
    schedulePattern === "FOUR_TENS" ? 10 : 8;

  const minPaidWeeklyHours = numberField(
    formData,
    "minPaidWeeklyHours",
    defaultMin,
  );

  const maxPaidWeeklyHours = numberField(
    formData,
    "maxPaidWeeklyHours",
    defaultMax,
  );

  const targetPaidWeeklyHours = numberField(
    formData,
    "targetPaidWeeklyHours",
    defaultTarget,
  );

  const scheduledShiftHours = numberField(
    formData,
    "scheduledShiftHours",
    defaultShift,
  );

  /*
   * HIVE STANDARD RULE
   * All workers default to a 30-minute unpaid lunch.
   * The advanced override remains available for management.
   */
  const unpaidLunchMinutes = numberField(
    formData,
    "unpaidLunchMinutes",
    30,
  );

  if (
    minPaidWeeklyHours < 0 ||
    maxPaidWeeklyHours < 0 ||
    targetPaidWeeklyHours < 0 ||
    scheduledShiftHours <= 0 ||
    unpaidLunchMinutes < 0
  ) {
    throw new Error(
      "Employment profile values cannot be negative.",
    );
  }

  if (minPaidWeeklyHours > maxPaidWeeklyHours) {
    throw new Error(
      "Minimum paid hours cannot exceed maximum paid hours.",
    );
  }

  if (
    targetPaidWeeklyHours >
    maxPaidWeeklyHours
  ) {
    throw new Error(
      "Target paid hours cannot exceed maximum paid hours.",
    );
  }

  await prisma.employmentProfile.upsert({
    where: {
      collectorId,
    },

    update: {
      employmentType,
      schedulePattern,
      minPaidWeeklyHours,
      maxPaidWeeklyHours,
      targetPaidWeeklyHours,
      scheduledShiftHours,
      unpaidLunchMinutes,
      active: true,
    },

    create: {
      collectorId,
      employmentType,
      schedulePattern,
      minPaidWeeklyHours,
      maxPaidWeeklyHours,
      targetPaidWeeklyHours,
      scheduledShiftHours,
      unpaidLunchMinutes,
      active: true,
    },
  });

  revalidatePath("/settings/workers");
  revalidatePath(
    "/settings/scheduling/employment-profiles",
  );
  revalidatePath(
    "/settings/scheduling/workforce",
  );
}
