"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const WORKFORCE_ROLES = [
  "MANAGEMENT",
  "PHLEBOTOMIST",
  "GROUP_LEAD",
  "PROCESSOR",
  "RECEPTION_TECH",
  "MSA",
  "DST",
  "OTHER",
] as const;

type WorkforceRoleValue =
  (typeof WORKFORCE_ROLES)[number];

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

function readOptionalText(
  formData: FormData,
  fieldName: string,
) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === ""
    ? null
    : trimmed;
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

  const parsedValue =
    Number.parseInt(value, 10);

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

function primaryRoleToEnum(
  role: string,
): WorkforceRoleValue {
  switch (role) {
    case "Management":
      return "MANAGEMENT";

    case "Phlebotomist":
      return "PHLEBOTOMIST";

    case "Group Lead":
      return "GROUP_LEAD";

    case "Processor":
      return "PROCESSOR";

    case "Reception Tech":
      return "RECEPTION_TECH";

    case "MSA":
      return "MSA";

    case "DST":
      return "DST";

    default:
      return "OTHER";
  }
}

function readEligibleRoles(
  formData: FormData,
  primaryRole: string,
) {
  const submitted =
    formData.getAll("eligibleRoles");

  const validRoles =
    submitted.filter(
      (
        value,
      ): value is WorkforceRoleValue =>
        typeof value === "string" &&
        WORKFORCE_ROLES.includes(
          value as WorkforceRoleValue,
        ),
    );

  // Primary role should always be an eligible role.
  validRoles.push(
    primaryRoleToEnum(primaryRole),
  );

  return Array.from(
    new Set(validRoles),
  );
}

function refreshRosterPages() {
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath(
    "/settings/workers",
  );
  revalidatePath(
    "/settings/workers/performance",
  );
}

export async function createCollector(
  formData: FormData,
) {
  const name =
    readRequiredText(
      formData,
      "name",
    );

  const role =
    readRequiredText(
      formData,
      "role",
    );

  const eligibleRoles =
    readEligibleRoles(
      formData,
      role,
    );

  const groupType =
    readRequiredText(
      formData,
      "groupType",
    );

  const active =
    readCheckbox(
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
      : (
          lastCollector?.position ??
          0
        ) + 1;

  await prisma.$transaction(
    async (tx) => {
      const collector =
        await tx.collector.create({
          data: {
            name,
            role,
            groupType,
            position:
              nextPosition,
            active,

            preferredName: null,
            profileTitle: null,
            bio: null,
            funFact: null,
            photoUrl: null,

            showOnMeetTheBees:
              active,

            isEmployeeOfMonth:
              false,

            recognitionMessage:
              null,
          },
        });

      await tx.workerRoleAssignment.createMany({
        data: eligibleRoles.map(
          (eligibleRole) => ({
            collectorId:
              collector.id,
            role: eligibleRole,
          }),
        ),
        skipDuplicates: true,
      });
    },
  );

  refreshRosterPages();
}

export async function updateCollector(
  formData: FormData,
) {
  const collectorId =
    readInteger(
      formData,
      "collectorId",
    );

  if (collectorId <= 0) {
    throw new Error(
      "A valid worker bee is required.",
    );
  }

  const name =
    readRequiredText(
      formData,
      "name",
    );

  const role =
    readRequiredText(
      formData,
      "role",
    );

  const eligibleRoles =
    readEligibleRoles(
      formData,
      role,
    );

  const groupType =
    readRequiredText(
      formData,
      "groupType",
    );

  const position =
    Math.max(
      1,
      readInteger(
        formData,
        "position",
        1,
      ),
    );

  const active =
    readCheckbox(
      formData,
      "active",
    );

  const preferredName =
    readOptionalText(
      formData,
      "preferredName",
    );

  const profileTitle =
    readOptionalText(
      formData,
      "profileTitle",
    );

  const bio =
    readOptionalText(
      formData,
      "bio",
    );

  const funFact =
    readOptionalText(
      formData,
      "funFact",
    );

  const photoUrl =
    readOptionalText(
      formData,
      "photoUrl",
    );

  const showOnMeetTheBees =
    active &&
    readCheckbox(
      formData,
      "showOnMeetTheBees",
    );

  const isEmployeeOfMonth =
    active &&
    readCheckbox(
      formData,
      "isEmployeeOfMonth",
    );

  const recognitionMessage =
    readOptionalText(
      formData,
      "recognitionMessage",
    );

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

  await prisma.$transaction(
    async (tx) => {
      if (isEmployeeOfMonth) {
        await tx.collector.updateMany({
          where: {
            isEmployeeOfMonth:
              true,

            NOT: {
              id: collectorId,
            },
          },

          data: {
            isEmployeeOfMonth:
              false,
          },
        });
      }

      await tx.collector.update({
        where: {
          id: collectorId,
        },

        data: {
          name,
          role,
          groupType,
          position,
          active,

          preferredName,
          profileTitle,
          bio,
          funFact,
          photoUrl,

          showOnMeetTheBees,
          isEmployeeOfMonth,
          recognitionMessage,
        },
      });

      // Replace the worker's role eligibility
      // with the current checkbox selections.
      await tx.workerRoleAssignment.deleteMany({
        where: {
          collectorId,
        },
      });

      await tx.workerRoleAssignment.createMany({
        data: eligibleRoles.map(
          (eligibleRole) => ({
            collectorId,
            role: eligibleRole,
          }),
        ),
        skipDuplicates: true,
      });
    },
  );

  refreshRosterPages();
}

export async function deactivateCollector(
  formData: FormData,
) {
  const collectorId =
    readInteger(
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
      showOnMeetTheBees:
        false,
      isEmployeeOfMonth:
        false,
    },
  });

  refreshRosterPages();
}

export async function reactivateCollector(
  formData: FormData,
) {
  const collectorId =
    readInteger(
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

  await prisma.collector.update({
    where: {
      id: collectorId,
    },

    data: {
      active: true,
      showOnMeetTheBees:
        true,
    },
  });

  refreshRosterPages();
}