export type WorkforceRole =
  | "MANAGEMENT"
  | "PHLEBOTOMIST"
  | "GROUP_LEAD"
  | "PROCESSOR"
  | "RECEPTION_TECH"
  | "MSA"
  | "DST"
  | "OTHER"
  | string;

export type WorkforceCollector = {
  id: number;
  name: string;
  preferredName?: string | null;
  role: string;
  groupType: string;
  active: boolean;
  roleAssignments: {
    role: WorkforceRole;
  }[];
};

export type TimeOffWindow = {
  collectorId: number;
  startDate: Date;
  endDate: Date;
};

export type DepartmentKey =
  | "reception"
  | "msa"
  | "floor"
  | "processing"
  | "leadership";

export type DayRequirement = {
  dayOfWeek: number;
  reception: number;
  msa: number;
  floor: number;
  processing: number;
  leadership: number;
};

export type DayWorkforceAudit = {
  date: Date;
  dayOfWeek: number;
  dayName: string;
  requirements: DayRequirement;
  available: Record<DepartmentKey, WorkforceCollector[]>;
  unavailable: WorkforceCollector[];
  gaps: Record<DepartmentKey, number>;
  isReady: boolean;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function primaryRoleToEnum(role: string): WorkforceRole {
  switch (role.trim().toLowerCase()) {
    case "management":
      return "MANAGEMENT";
    case "phlebotomist":
      return "PHLEBOTOMIST";
    case "group lead":
      return "GROUP_LEAD";
    case "processor":
      return "PROCESSOR";
    case "reception tech":
    case "receptionist":
      return "RECEPTION_TECH";
    case "msa":
      return "MSA";
    case "dst":
      return "DST";
    default:
      return "OTHER";
  }
}

export function getEligibleRoles(
  collector: WorkforceCollector,
): Set<WorkforceRole> {
  const roles = new Set<WorkforceRole>();

  for (const assignment of collector.roleAssignments) {
    roles.add(assignment.role);
  }

  // Compatibility safety net: primary/display role remains authoritative
  // even if an older worker record is missing the explicit role assignment.
  roles.add(primaryRoleToEnum(collector.role));

  // Locked Riviera Beach qualification rules:
  // Every phlebotomist can perform DST work.
  if (roles.has("PHLEBOTOMIST")) {
    roles.add("DST");
  }

  // Every MSA is Reception-trained.
  if (roles.has("MSA")) {
    roles.add("RECEPTION_TECH");
  }

  return roles;
}

function isIndividualManagementWorker(
  collector: WorkforceCollector,
): boolean {
  const normalizedName = collector.name.trim().toLowerCase();
  const roles = getEligibleRoles(collector);

  // Leadership eligibility should follow the worker's actual role eligibility,
  // not only the legacy primary/display role. This matters for cross-trained
  // or migrated workers whose MANAGEMENT capability exists in roleAssignments.
  //
  // Exclude only generic/group shell records such as "Management Team".
  const isGenericManagementShell =
    normalizedName === "management" ||
    normalizedName === "management team";

  return (
    roles.has("MANAGEMENT") &&
    !isGenericManagementShell
  );
}

export function isEligibleFor(
  collector: WorkforceCollector,
  department: DepartmentKey,
): boolean {
  const roles = getEligibleRoles(collector);

  switch (department) {
    case "reception":
      return roles.has("RECEPTION_TECH");

    case "msa":
      return roles.has("MSA");

    case "floor":
      return roles.has("PHLEBOTOMIST") || roles.has("DST");

    case "processing":
      return roles.has("PROCESSOR");

    case "leadership":
      // Current HIVE 1 data identifies CM/ACM/CS as individual Management
      // records. A generic Management Team display shell never counts.
      return isIndividualManagementWorker(collector);

    default:
      return false;
  }
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

function isOnTimeOff(
  collectorId: number,
  date: Date,
  timeOff: TimeOffWindow[],
): boolean {
  const target = startOfUtcDay(date).getTime();

  return timeOff.some((entry) => {
    if (entry.collectorId !== collectorId) return false;

    const start = startOfUtcDay(entry.startDate).getTime();
    const end = startOfUtcDay(entry.endDate).getTime();

    return target >= start && target <= end;
  });
}

function gap(required: number, available: number) {
  return Math.max(0, required - available);
}

export function buildWorkforceAudit({
  weekStart,
  collectors,
  timeOff,
  requirementsByDay,
}: {
  weekStart: Date;
  collectors: WorkforceCollector[];
  timeOff: TimeOffWindow[];
  requirementsByDay: Map<number, DayRequirement>;
}): DayWorkforceAudit[] {
  const activeWorkers = collectors.filter((collector) => collector.active);

  return Array.from({ length: 7 }, (_, offset) => {
    const date = startOfUtcDay(weekStart);
    date.setUTCDate(date.getUTCDate() + offset);

    const dayOfWeek = date.getUTCDay();

    const requirements =
      requirementsByDay.get(dayOfWeek) ?? {
        dayOfWeek,
        reception: 0,
        msa: 0,
        floor: 0,
        processing: 0,
        leadership: 0,
      };

    const unavailable = activeWorkers.filter((collector) =>
      isOnTimeOff(collector.id, date, timeOff),
    );

    const unavailableIds = new Set(
      unavailable.map((collector) => collector.id),
    );

    const availableWorkers = activeWorkers.filter(
      (collector) => !unavailableIds.has(collector.id),
    );

    const available: Record<DepartmentKey, WorkforceCollector[]> = {
      reception: availableWorkers.filter((worker) =>
        isEligibleFor(worker, "reception"),
      ),
      msa: availableWorkers.filter((worker) =>
        isEligibleFor(worker, "msa"),
      ),
      floor: availableWorkers.filter((worker) =>
        isEligibleFor(worker, "floor"),
      ),
      processing: availableWorkers.filter((worker) =>
        isEligibleFor(worker, "processing"),
      ),
      leadership: availableWorkers.filter((worker) =>
        isEligibleFor(worker, "leadership"),
      ),
    };

    const gaps: Record<DepartmentKey, number> = {
      reception: gap(
        requirements.reception,
        available.reception.length,
      ),
      msa: gap(requirements.msa, available.msa.length),
      floor: gap(requirements.floor, available.floor.length),
      processing: gap(
        requirements.processing,
        available.processing.length,
      ),
      leadership: gap(
        requirements.leadership,
        available.leadership.length,
      ),
    };

    return {
      date,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek] ?? `Day ${dayOfWeek}`,
      requirements,
      available,
      unavailable,
      gaps,
      isReady: Object.values(gaps).every((value) => value === 0),
    };
  });
}

export function startOfOperationalWeek(date: Date): Date {
  const value = startOfUtcDay(date);
  value.setUTCDate(value.getUTCDate() - value.getUTCDay());
  return value;
}

export const workforceConstraintMetadata = {
  qualification: {
    status: "ACTIVE",
    text: "Primary role plus all explicit eligible roles are honored. Phlebotomist implies DST; MSA implies Reception.",
  },
  timeOff: {
    status: "HARD",
    text: "A worker on imported Time Off is removed from that day's available pool.",
  },
  employmentHours: {
    status: "PENDING DATA",
    text: "FTE/PTE status is not yet stored on HIVE 1 workers, so S3B does not invent 37–40 or ≤29 hour enforcement.",
  },
  shiftPattern: {
    status: "PENDING DATA",
    text: "The default 8-hour pattern and future 4×10 profiles are not assigned until worker schedule profiles exist.",
  },
  assignment: {
    status: "NOT YET",
    text: "S3B audits whether qualified people exist. It does not assign a worker to two departments or generate a schedule.",
  },
} as const;
