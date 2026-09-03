use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function toFloat(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export async function saveEmploymentProfile(formData: FormData) {
  await requireAdmin();

  const collectorId = Number(formData.get("collectorId"));

  if (!Number.isInteger(collectorId)) {
    throw new Error("Invalid worker.");
  }

  const employmentType = String(formData.get("employmentType"));
  const schedulePattern = String(formData.get("schedulePattern"));

  if (!["FTE", "PTE"].includes(employmentType)) {
    throw new Error("Invalid employment type.");
  }

  if (!["STANDARD_8", "FOUR_TENS"].includes(schedulePattern)) {
    throw new Error("Invalid schedule pattern.");
  }

  const minPaidWeeklyHours = toFloat(
    formData.get("minPaidWeeklyHours"),
    employmentType === "FTE" ? 37 : 0,
  );

  const maxPaidWeeklyHours = toFloat(
    formData.get("maxPaidWeeklyHours"),
    employmentType === "FTE" ? 40 : 29,
  );

  const targetPaidWeeklyHours = toFloat(
    formData.get("targetPaidWeeklyHours"),
    employmentType === "FTE" ? 40 : 0,
  );

  const scheduledShiftHours = toFloat(
    formData.get("scheduledShiftHours"),
    schedulePattern === "FOUR_TENS" ? 10 : 8,
  );

  const unpaidLunchMinutes = toInt(
    formData.get("unpaidLunchMinutes"),
    30,
  );

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

  revalidatePath(`/settings/workers/${collectorId}`);
  revalidatePath("/settings/scheduling/workforce");
}
