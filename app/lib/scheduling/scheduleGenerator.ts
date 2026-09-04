import {
  getEligibleRoles,
  type WorkforceCollector,
} from "@/app/lib/scheduling/workforceConstraintEngine";
import {
  doorCloseMinute,
  roleOpenMinute,
  schedulingPolicy,
  type SchedulingRole,
} from "@/app/lib/scheduling/schedulingPolicy";

export type GeneratorEmploymentProfile = {
  employmentType: "FTE" | "PTE" | string;
  schedulePattern: "STANDARD_8" | "FOUR_TENS" | string;
  minPaidWeeklyHours: number;
  maxPaidWeeklyHours: number;
  targetPaidWeeklyHours: number;
  scheduledShiftHours: number;
  unpaidLunchMinutes: number;
};

export type GeneratorWorker = WorkforceCollector & {
  employmentProfile: GeneratorEmploymentProfile | null;
};

export type GeneratorTimeOff = {
  collectorId: number;
  startDate: Date;
  endDate: Date;
};

export type GeneratorRequirement = {
  dayOfWeek: number;
  dayName: string;
  time: string;
  minuteOfDay: number;
  receptionBaseline: number;
  msaMinimum: number;
  floorMinimum: number;
  processingMinimum: number;
  leadershipMinimum: number;
};

export type GeneratedShift = {
  workerId: number;
  workerName: string;
  dayOfWeek: number;
  dayName: string;
  role:
    | "Leadership"
    | "MSA"
    | "Processing"
    | "Donor Floor"
    | "Reception";
  orientation: "OPENER" | "CLOSER" | "MID";
  startMinute: number;
  endMinute: number;
  startTime: string;
  endTime: string;
  scheduledHours: number;
  paidHours: number;
  lunchStartMinute: number | null;
  lunchStartTime: string | null;
  source: "PRIMARY" | "CROSS_TRAINED" | "MANAGEMENT_EXCEPTION";
};

export type GenerationWarning = {
  dayOfWeek: number;
  dayName: string;
  message: string;
};

export type GeneratedWeek = {
  shifts: GeneratedShift[];
  warnings: GenerationWarning[];
  paidHoursByWorker: Map<number, number>;
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

type Role = GeneratedShift["role"];

type RoleBoundary = {
  openStart: number;
  closeEnd: number;
};

function roleForPrimary(role: string): Role | null {
  const normalized = role.trim().toLowerCase();

  if (normalized === "management") return "Leadership";
  if (normalized === "msa") return "MSA";
  if (normalized === "processor") return "Processing";
  if (
    normalized === "phlebotomist" ||
    normalized === "dst"
  ) {
    return "Donor Floor";
  }

  if (
    normalized === "reception tech" ||
    normalized === "receptionist"
  ) {
    return "Reception";
  }

  return null;
}

function isGenericManagementShell(
  worker: GeneratorWorker,
) {
  const name = worker.name.trim().toLowerCase();

  return (
    name === "management" ||
    name === "management team"
  );
}

function workerEligibleFor(
  worker: GeneratorWorker,
  role: Role,
) {
  const roles = getEligibleRoles(worker);

  if (role === "Leadership") {
    return (
      roles.has("MANAGEMENT") &&
      !isGenericManagementShell(worker)
    );
  }

  if (role === "MSA") return roles.has("MSA");
  if (role === "Processing") return roles.has("PROCESSOR");
  if (role === "Reception") return roles.has("RECEPTION_TECH");

  return (
    roles.has("PHLEBOTOMIST") ||
    roles.has("DST")
  );
}

function isPrimaryFor(
  worker: GeneratorWorker,
  role: Role,
) {
  return roleForPrimary(worker.role) === role;
}

function isManagement(worker: GeneratorWorker) {
  return getEligibleRoles(worker).has("MANAGEMENT");
}

function isPhlebotomist(worker: GeneratorWorker) {
  return getEligibleRoles(worker).has("PHLEBOTOMIST");
}

function utcDay(value: Date) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

function dateForDayOfWeek(
  weekStart: Date,
  dayOfWeek: number,
) {
  const date = utcDay(weekStart);
  date.setUTCDate(date.getUTCDate() + dayOfWeek);
  return date;
}

function isOnTimeOff(
  workerId: number,
  date: Date,
  timeOff: GeneratorTimeOff[],
) {
  const target = utcDay(date).getTime();

  return timeOff.some((entry) => {
    if (entry.collectorId !== workerId) return false;

    const start = utcDay(entry.startDate).getTime();
    const end = utcDay(entry.endDate).getTime();

    return target >= start && target <= end;
  });
}

function formatMinute(minute: number) {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minutePart = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 =
    hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${String(minutePart).padStart(
    2,
    "0",
  )} ${suffix}`;
}

function candidateShiftMinutes(
  profile: GeneratorEmploymentProfile,
) {
  return Math.round(
    profile.scheduledShiftHours * 60,
  );
}

function paidHoursForShift(
  scheduledMinutes: number,
  profile: GeneratorEmploymentProfile,
) {
  return Math.max(
    0,
    scheduledMinutes / 60 -
      profile.unpaidLunchMinutes / 60,
  );
}

function chooseLunchStart(
  startMinute: number,
  endMinute: number,
  profile: GeneratorEmploymentProfile,
  orientation: GeneratedShift["orientation"],
  lunchOrdinal: number,
) {
  const base =
    orientation === "OPENER"
      ? startMinute +
        schedulingPolicy.lunch.openerEligibleAfterMinutes
      : startMinute +
        schedulingPolicy.lunch.closerEligibleAfterMinutes;

  const candidate =
    base + lunchOrdinal * profile.unpaidLunchMinutes;

  const latest =
    endMinute - profile.unpaidLunchMinutes;

  return candidate <= latest ? candidate : null;
}

function requirementAt(
  rows: GeneratorRequirement[],
  minute: number,
  role: Role,
) {
  const row = rows.find(
    (item) => item.minuteOfDay === minute,
  );

  if (!row) return 0;

  if (role === "Leadership") return row.leadershipMinimum;
  if (role === "MSA") return row.msaMinimum;
  if (role === "Processing") return row.processingMinimum;
  if (role === "Donor Floor") return row.floorMinimum;

  return row.receptionBaseline;
}

function maxRequirement(
  rows: GeneratorRequirement[],
  role: Role,
) {
  if (rows.length === 0) return 0;

  return Math.max(
    0,
    ...rows.map((row) =>
      role === "Leadership"
        ? row.leadershipMinimum
        : role === "MSA"
          ? row.msaMinimum
          : role === "Processing"
            ? row.processingMinimum
            : role === "Donor Floor"
              ? row.floorMinimum
              : row.receptionBaseline,
    ),
  );
}

/*
 * Planning estimate for the LAST donor's disconnect.
 *
 * We intentionally do not hard-code "Floor ends 30 minutes after doors close."
 * Instead HIVE uses the latest demand-bearing half-hour before door close:
 *
 * latest arrival block
 * + remainder of that arrival interval
 * + Check-in-to-Stick target
 * + planned donation duration
 *
 * Example weekday:
 * final active interval begins 6:30 PM
 * interval may contain arrivals through 7:00 PM
 * + 25 min to stick
 * + 40 min donation
 * => planned last disconnect around 8:05 PM
 *
 * This is a planning estimate. Future real-time last-donor intelligence can
 * replace this estimate without changing the generator architecture.
 */
function estimatedFinalDisconnectMinute(
  dayOfWeek: number,
  rows: GeneratorRequirement[],
) {
  const close = doorCloseMinute(dayOfWeek);

  const demandRows = rows
    .filter((row) => row.minuteOfDay < close)
    .filter(
      (row) =>
        row.receptionBaseline > 0 ||
        row.floorMinimum > 0,
    );

  if (demandRows.length === 0) {
    return close;
  }

  const lastDemandStart = Math.max(
    ...demandRows.map((row) => row.minuteOfDay),
  );

  const intervalEnd =
    lastDemandStart +
    schedulingPolicy.donorFlow.arrivalIntervalMinutes;

  return (
    intervalEnd +
    schedulingPolicy.donorFlow
      .returningCheckinToStickTargetMinutes +
    schedulingPolicy.donorFlow.plannedDonationMinutes
  );
}

function exactRoleBoundary(
  dayOfWeek: number,
  role: Role,
  rows: GeneratorRequirement[],
): RoleBoundary {
  const doorClose = doorCloseMinute(dayOfWeek);
  const estimatedDisconnect =
    estimatedFinalDisconnectMinute(
      dayOfWeek,
      rows,
    );

  let closeEnd: number;

  switch (role) {
    case "Reception":
      closeEnd =
        doorClose +
        schedulingPolicy.reception.maxPostCloseMinutes;
      break;

    case "Donor Floor":
      closeEnd = estimatedDisconnect;
      break;

    case "Processing":
      closeEnd =
        estimatedDisconnect +
        schedulingPolicy.processing
          .postFinalDisconnectMinutes;
      break;

    case "Leadership":
      closeEnd =
        Math.max(
          doorClose,
          estimatedDisconnect,
        ) + 30;
      break;

    case "MSA":
      closeEnd = doorClose;
      break;
  }

  return {
    openStart: roleOpenMinute(
      dayOfWeek,
      role as SchedulingRole,
    ),
    closeEnd,
  };
}

function preferredWorkerScore(
  worker: GeneratorWorker,
  role: Role,
  paidHours: number,
  orientation: GeneratedShift["orientation"],
) {
  const profile = worker.employmentProfile;
  if (!profile) return -99999;

  let score = 0;

  if (isPrimaryFor(worker, role)) score += 120;
  else score += 45;

  if (
    isManagement(worker) &&
    role !== "Leadership"
  ) {
    score -= 100;
  }

  if (profile.employmentType === "FTE") {
    score += 20;
  }

  score += Math.max(
    -40,
    profile.targetPaidWeeklyHours - paidHours,
  );

  if (orientation === "OPENER") {
    score += worker.id % 2 === 0 ? 4 : 0;
  } else if (orientation === "CLOSER") {
    score += worker.id % 2 !== 0 ? 4 : 0;
  }

  return score;
}

function workerAvailableForNewShift({
  worker,
  date,
  timeOff,
  usedToday,
  paidHoursByWorker,
  startMinute,
  endMinute,
}: {
  worker: GeneratorWorker;
  date: Date;
  timeOff: GeneratorTimeOff[];
  usedToday: Set<number>;
  paidHoursByWorker: Map<number, number>;
  startMinute: number;
  endMinute: number;
}) {
  if (!worker.active || !worker.employmentProfile) {
    return false;
  }

  if (usedToday.has(worker.id)) return false;

  if (isOnTimeOff(worker.id, date, timeOff)) {
    return false;
  }

  const paid = paidHoursForShift(
    endMinute - startMinute,
    worker.employmentProfile,
  );

  const current =
    paidHoursByWorker.get(worker.id) ?? 0;

  return (
    current + paid <=
    worker.employmentProfile.maxPaidWeeklyHours +
      0.001
  );
}

function chooseWorker({
  workers,
  role,
  date,
  timeOff,
  usedToday,
  paidHoursByWorker,
  startMinute,
  endMinute,
  orientation,
  requirePhlebotomist,
}: {
  workers: GeneratorWorker[];
  role: Role;
  date: Date;
  timeOff: GeneratorTimeOff[];
  usedToday: Set<number>;
  paidHoursByWorker: Map<number, number>;
  startMinute: number;
  endMinute: number;
  orientation: GeneratedShift["orientation"];
  requirePhlebotomist?: boolean;
}) {
  return workers
    .filter((worker) =>
      workerAvailableForNewShift({
        worker,
        date,
        timeOff,
        usedToday,
        paidHoursByWorker,
        startMinute,
        endMinute,
      }),
    )
    .filter((worker) =>
      workerEligibleFor(worker, role),
    )
    .filter((worker) =>
      requirePhlebotomist
        ? isPhlebotomist(worker)
        : true,
    )
    .sort((a, b) => {
      const aScore = preferredWorkerScore(
        a,
        role,
        paidHoursByWorker.get(a.id) ?? 0,
        orientation,
      );

      const bScore = preferredWorkerScore(
        b,
        role,
        paidHoursByWorker.get(b.id) ?? 0,
        orientation,
      );

      return bScore - aScore;
    })[0];
}

function addShift({
  shifts,
  worker,
  role,
  dayOfWeek,
  dayName,
  startMinute,
  endMinute,
  orientation,
  paidHoursByWorker,
  usedToday,
  lunchOrdinal,
}: {
  shifts: GeneratedShift[];
  worker: GeneratorWorker;
  role: Role;
  dayOfWeek: number;
  dayName: string;
  startMinute: number;
  endMinute: number;
  orientation: GeneratedShift["orientation"];
  paidHoursByWorker: Map<number, number>;
  usedToday: Set<number>;
  lunchOrdinal: number;
}) {
  const profile = worker.employmentProfile!;
  const scheduledMinutes =
    endMinute - startMinute;
  const paidHours = paidHoursForShift(
    scheduledMinutes,
    profile,
  );

  const lunchStartMinute = chooseLunchStart(
    startMinute,
    endMinute,
    profile,
    orientation,
    lunchOrdinal,
  );

  const source: GeneratedShift["source"] =
    isPrimaryFor(worker, role)
      ? "PRIMARY"
      : isManagement(worker) &&
          role !== "Leadership"
        ? "MANAGEMENT_EXCEPTION"
        : "CROSS_TRAINED";

  shifts.push({
    workerId: worker.id,
    workerName:
      worker.preferredName || worker.name,
    dayOfWeek,
    dayName,
    role,
    orientation,
    startMinute,
    endMinute,
    startTime: formatMinute(startMinute),
    endTime: formatMinute(endMinute),
    scheduledHours:
      scheduledMinutes / 60,
    paidHours,
    lunchStartMinute,
    lunchStartTime:
      lunchStartMinute === null
        ? null
        : formatMinute(lunchStartMinute),
    source,
  });

  usedToday.add(worker.id);
  paidHoursByWorker.set(
    worker.id,
    (paidHoursByWorker.get(worker.id) ?? 0) +
      paidHours,
  );
}

function generateRoleCoverage({
  workers,
  timeOff,
  dayRequirements,
  weekStart,
  dayOfWeek,
  role,
  shifts,
  warnings,
  paidHoursByWorker,
  usedToday,
}: {
  workers: GeneratorWorker[];
  timeOff: GeneratorTimeOff[];
  dayRequirements: GeneratorRequirement[];
  weekStart: Date;
  dayOfWeek: number;
  role: Role;
  shifts: GeneratedShift[];
  warnings: GenerationWarning[];
  paidHoursByWorker: Map<number, number>;
  usedToday: Set<number>;
}) {
  const dayName = DAY_NAMES[dayOfWeek];
  const boundary = exactRoleBoundary(
    dayOfWeek,
    role,
    dayRequirements,
  );

  const peak = maxRequirement(
    dayRequirements,
    role,
  );

  if (peak <= 0) return;

  const date = dateForDayOfWeek(
    weekStart,
    dayOfWeek,
  );

  for (let slot = 0; slot < peak; slot += 1) {
    const sampleProfile = workers.find(
      (worker) =>
        worker.employmentProfile &&
        workerEligibleFor(worker, role),
    )?.employmentProfile;

    if (!sampleProfile) {
      warnings.push({
        dayOfWeek,
        dayName,
        message: `${role}: no employment-profiled qualified worker exists.`,
      });
      return;
    }

    const shiftMinutes =
      candidateShiftMinutes(sampleProfile);

    const startMinute = boundary.openStart;
    const endMinute =
      startMinute + shiftMinutes;

    const worker = chooseWorker({
      workers,
      role,
      date,
      timeOff,
      usedToday,
      paidHoursByWorker,
      startMinute,
      endMinute,
      orientation: "OPENER",
      requirePhlebotomist:
        role === "Donor Floor" &&
        slot === 0,
    });

    if (!worker) {
      warnings.push({
        dayOfWeek,
        dayName,
        message: `${role}: unable to assign opener slot ${
          slot + 1
        } at ${formatMinute(
          boundary.openStart,
        )}.`,
      });
      continue;
    }

    const actualShiftMinutes =
      candidateShiftMinutes(
        worker.employmentProfile!,
      );

    addShift({
      shifts,
      worker,
      role,
      dayOfWeek,
      dayName,
      startMinute: boundary.openStart,
      endMinute:
        boundary.openStart +
        actualShiftMinutes,
      orientation: "OPENER",
      paidHoursByWorker,
      usedToday,
      lunchOrdinal: slot,
    });
  }

  const openerShifts = shifts.filter(
    (shift) =>
      shift.dayOfWeek === dayOfWeek &&
      shift.role === role &&
      shift.orientation === "OPENER",
  );

  const latestOpenerEnd =
    openerShifts.length > 0
      ? Math.max(
          ...openerShifts.map(
            (shift) => shift.endMinute,
          ),
        )
      : boundary.openStart;

  if (latestOpenerEnd < boundary.closeEnd) {
    for (let slot = 0; slot < peak; slot += 1) {
      const sampleProfile = workers.find(
        (worker) =>
          worker.employmentProfile &&
          workerEligibleFor(worker, role),
      )?.employmentProfile;

      if (!sampleProfile) continue;

      const shiftMinutes =
        candidateShiftMinutes(sampleProfile);

      const endMinute = boundary.closeEnd;
      const startMinute =
        endMinute - shiftMinutes;

      const worker = chooseWorker({
        workers,
        role,
        date,
        timeOff,
        usedToday,
        paidHoursByWorker,
        startMinute,
        endMinute,
        orientation: "CLOSER",
        requirePhlebotomist:
          role === "Donor Floor" &&
          slot === 0,
      });

      if (!worker) {
        warnings.push({
          dayOfWeek,
          dayName,
          message: `${role}: unable to assign closer slot ${
            slot + 1
          } ending ${formatMinute(
            boundary.closeEnd,
          )}.`,
        });
        continue;
      }

      addShift({
        shifts,
        worker,
        role,
        dayOfWeek,
        dayName,
        startMinute,
        endMinute,
        orientation: "CLOSER",
        paidHoursByWorker,
        usedToday,
        lunchOrdinal: slot,
      });
    }
  }

  for (const row of dayRequirements) {
    const required = requirementAt(
      dayRequirements,
      row.minuteOfDay,
      role,
    );

    if (required <= 0) continue;

    const covering = shifts.filter(
      (shift) =>
        shift.dayOfWeek === dayOfWeek &&
        shift.role === role &&
        shift.startMinute <= row.minuteOfDay &&
        shift.endMinute > row.minuteOfDay,
    );

    let missing =
      required - covering.length;

    while (missing > 0) {
      const sampleProfile = workers.find(
        (worker) =>
          worker.employmentProfile &&
          workerEligibleFor(worker, role),
      )?.employmentProfile;

      if (!sampleProfile) break;

      const shiftMinutes =
        candidateShiftMinutes(sampleProfile);

      const startMinute = Math.max(
        boundary.openStart,
        Math.min(
          row.minuteOfDay,
          boundary.closeEnd -
            shiftMinutes,
        ),
      );

      const endMinute =
        startMinute + shiftMinutes;

      const worker = chooseWorker({
        workers,
        role,
        date,
        timeOff,
        usedToday,
        paidHoursByWorker,
        startMinute,
        endMinute,
        orientation: "MID",
        requirePhlebotomist:
          role === "Donor Floor" &&
          !covering.some((shift) => {
            const match = workers.find(
              (item) =>
                item.id === shift.workerId,
            );

            return match
              ? isPhlebotomist(match)
              : false;
          }),
      });

      if (!worker) {
        warnings.push({
          dayOfWeek,
          dayName,
          message: `${role}: ${formatMinute(
            row.minuteOfDay,
          )} still needs ${missing} additional worker(s).`,
        });
        break;
      }

      addShift({
        shifts,
        worker,
        role,
        dayOfWeek,
        dayName,
        startMinute,
        endMinute,
        orientation: "MID",
        paidHoursByWorker,
        usedToday,
        lunchOrdinal: covering.length,
      });

      covering.push(
        shifts[shifts.length - 1],
      );

      missing -= 1;
    }
  }
}

export function generateDraftSchedule({
  weekStart,
  workers,
  timeOff,
  requirements,
}: {
  weekStart: Date;
  workers: GeneratorWorker[];
  timeOff: GeneratorTimeOff[];
  requirements: GeneratorRequirement[];
}): GeneratedWeek {
  const shifts: GeneratedShift[] = [];
  const warnings: GenerationWarning[] = [];
  const paidHoursByWorker =
    new Map<number, number>();

  for (const worker of workers) {
    paidHoursByWorker.set(worker.id, 0);
  }

  for (
    let dayOfWeek = 0;
    dayOfWeek < 7;
    dayOfWeek += 1
  ) {
    const dayRequirements =
      requirements.filter(
        (row) =>
          row.dayOfWeek === dayOfWeek,
      );

    const usedToday = new Set<number>();

    const roles: Role[] = [
      "Leadership",
      "MSA",
      "Processing",
      "Donor Floor",
      "Reception",
    ];

    for (const role of roles) {
      generateRoleCoverage({
        workers,
        timeOff,
        dayRequirements,
        weekStart,
        dayOfWeek,
        role,
        shifts,
        warnings,
        paidHoursByWorker,
        usedToday,
      });
    }
  }

  for (const worker of workers) {
    const profile =
      worker.employmentProfile;

    if (
      !profile ||
      profile.employmentType !== "FTE"
    ) {
      continue;
    }

    const paid =
      paidHoursByWorker.get(worker.id) ?? 0;

    if (
      paid + 0.001 <
      profile.minPaidWeeklyHours
    ) {
      warnings.push({
        dayOfWeek: -1,
        dayName: "Week",
        message: `${
          worker.preferredName || worker.name
        }: ${paid.toFixed(
          1,
        )} paid hours, below FTE minimum ${
          profile.minPaidWeeklyHours
        }.`,
      });
    }
  }

  return {
    shifts,
    warnings,
    paidHoursByWorker,
  };
}
