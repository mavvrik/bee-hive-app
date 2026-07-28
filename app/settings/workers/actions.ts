"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function readRequiredText(
  formData: FormData,
  fieldName: string,
) {
  const value = formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return value.trim();
}

function readInteger(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value = formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return fallback;
  }

  const parsedValue = Number.parseInt(
    value,
    10,
  );

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

function readNumber(
  formData: FormData,
  fieldName: string,
  fallback = 0,
) {
  const value = formData.get(fieldName);

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

function readCheckbox(
  formData: FormData,
  fieldName: string,
) {
  return (
    formData.get(fieldName) === "on"
  );
}

function refreshRosterPages() {
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath(
    "/settings/workers",
  );
}

export async function createCollector(
  formData: FormData,
) {
  const name = readRequiredText(
    formData,
    "name",
  );

  const role = readRequiredText(
    formData,
    "role",
  );

  const groupType = readRequiredText(
    formData,
    "groupType",
  );

  const participatesInTarget =
    readCheckbox(
      formData,
      "participatesInTarget",
    );

  const active = readCheckbox(
    formData,
    "active",
  );

  const requestedPosition =
    readInteger(
      formData,
      "position",
      0,
    );

  const existingCollector =
    await prisma.collector.findFirst({
      where: {
        name: {
          equals: name,
        },
      },
    });

  if (existingCollector) {
    throw new Error(
      "A worker bee with this name already exists.",
    );
  }

  const lastCollector =
    await prisma.collector.findFirst({
      orderBy: {
        position: "desc",
      },
    });

  const nextPosition =
    requestedPosition > 0
      ? requestedPosition
      : (lastCollector?.position ??
          0) + 1;

  await prisma.collector.create({
    data: {
      name,
      role,
      groupType,
      position: nextPosition,
      active,
      participatesInTarget,
      targetAdjustmentLiters: 0,
    },
  });

  refreshRosterPages();
}

export async function updateCollector(
  formData: FormData,
) {
  const collectorId = readInteger(
    formData,
    "collectorId",
  );

  if (collectorId <= 0) {
    throw new Error(
      "A valid worker bee is required.",
    );
  }

  const name = readRequiredText(
    formData,
    "name",
  );

  const role = readRequiredText(
    formData,
    "role",
  );

  const groupType = readRequiredText(
    formData,
    "groupType",
  );

  const position = Math.max(
    1,
    readInteger(
      formData,
      "position",
      1,
    ),
  );

  const active = readCheckbox(
    formData,
    "active",
  );

  const participatesInTarget =
    active &&
    readCheckbox(
      formData,
      "participatesInTarget",
    );

  const targetAdjustmentLiters =
    participatesInTarget
      ? readNumber(
          formData,
          "targetAdjustmentLiters",
          0,
        )
      : 0;

  const duplicateCollector =
    await prisma.collector.findFirst({
      where: {
        name: {
          equals: name,
        },
        NOT: {
          id: collectorId,
        },
      },
    });

  if (duplicateCollector) {
    throw new Error(
      "Another worker bee already uses this name.",
    );
  }

  await prisma.collector.update({
    where: {
      id: collectorId,
    },
    data: {
      name,
      role,
      groupType,
      position,
      active,
      participatesInTarget,
      targetAdjustmentLiters,
    },
  });

  refreshRosterPages();
}

export async function deactivateCollector(
  formData: FormData,
) {
  const collectorId = readInteger(
    formData,
    "collectorId",
  );

  if (collectorId <= 0) {
    throw new Error(
      "A valid worker bee is required.",
    );
  }

  await prisma.collector.update({
    where: {
      id: collectorId,
    },
    data: {
      active: false,
      participatesInTarget: false,
      targetAdjustmentLiters: 0,
    },
  });

  refreshRosterPages();
}

export async function reactivateCollector(
  formData: FormData,
) {
  const collectorId = readInteger(
    formData,
    "collectorId",
  );

  if (collectorId <= 0) {
    throw new Error(
      "A valid worker bee is required.",
    );
  }

  const collector =
    await prisma.collector.findUnique({
      where: {
        id: collectorId,
      },
    });

  if (!collector) {
    throw new Error(
      "Worker bee could not be found.",
    );
  }

  const shouldParticipate =
    collector.role ===
      "Phlebotomist" ||
    collector.groupType ===
      "Individual";

  await prisma.collector.update({
    where: {
      id: collectorId,
    },
    data: {
      active: true,
      participatesInTarget:
        shouldParticipate,
    },
  });

  refreshRosterPages();
}