import {
  getEligibleRoles,
  type WorkforceCollector,
} from "@/app/lib/scheduling/workforceConstraintEngine";

export type EmploymentProfileForFeasibility = {
  employmentType: "FTE" | "PTE" | string;
  schedulePattern: "STANDARD_8" | "FOUR_TENS" | string;
  minPaidWeeklyHours: number;
  maxPaidWeeklyHours: number;
  targetPaidWeeklyHours: number;
  scheduledShiftHours: number;
  unpaidLunchMinutes: number;
};

export type FeasibilityWorker = WorkforceCollector & {
  employmentProfile: EmploymentProfileForFeasibility | null;
};

export type TimeOffForFeasibility = {
  collectorId: number;
  startDate: Date;
  endDate: Date;
};

export type IntervalRequirement = {
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

export type DepartmentName =
  | "Leadership"
  | "MSA"
  | "Processing"
  | "Donor Floor - Phlebotomist"
  | "Donor Floor"
  | "Reception";

export type Slot = {
  department: DepartmentName;
  slotIndex: number;
};

export type IntervalAssignment = {
  department: DepartmentName;
  workerId: number;
  workerName: string;
};

export type IntervalFeasibility = {
  dayOfWeek: number;
  dayName: string;
  time: string;
  minuteOfDay: number;
  requiredSlots: number;
  feasible: boolean;
  assignments: IntervalAssignment[];
  unfilled: Slot[];
  unavailableWorkerIds: number[];
};

export type WeeklyFeasibilitySummary = {
  intervals: IntervalFeasibility[];
  failedIntervals: IntervalFeasibility[];
  requiredCoverageHours: number;
  rosterMinimumPaidHours: number;
  rosterTargetPaidHours: number;
  rosterMaximumPaidHours: number;
  unprofiledWorkers: FeasibilityWorker[];
  maxHoursFeasible: boolean;
};

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
  const result = utcDay(weekStart);
  result.setUTCDate(result.getUTCDate() + dayOfWeek);
  return result;
}

function onTimeOff(
  workerId: number,
  date: Date,
  timeOff: TimeOffForFeasibility[],
) {
  const target = utcDay(date).getTime();

  return timeOff.some((entry) => {
    if (entry.collectorId !== workerId) return false;

    const start = utcDay(entry.startDate).getTime();
    const end = utcDay(entry.endDate).getTime();

    return target >= start && target <= end;
  });
}

function isGenericManagementShell(worker: FeasibilityWorker) {
  const normalized = worker.name.trim().toLowerCase();

  return (
    normalized === "management" ||
    normalized === "management team"
  );
}

function workerCanFill(
  worker: FeasibilityWorker,
  slot: Slot,
) {
  const roles = getEligibleRoles(worker);

  switch (slot.department) {
    case "Leadership":
      return (
        roles.has("MANAGEMENT") &&
        !isGenericManagementShell(worker)
      );

    case "MSA":
      return roles.has("MSA");

    case "Processing":
      return roles.has("PROCESSOR");

    case "Donor Floor - Phlebotomist":
      return roles.has("PHLEBOTOMIST");

    case "Donor Floor":
      return (
        roles.has("PHLEBOTOMIST") ||
        roles.has("DST")
      );

    case "Reception":
      return roles.has("RECEPTION_TECH");
  }
}

function buildSlots(
  requirement: IntervalRequirement,
): Slot[] {
  const slots: Slot[] = [];

  for (
    let index = 0;
    index < requirement.leadershipMinimum;
    index += 1
  ) {
    slots.push({
      department: "Leadership",
      slotIndex: index,
    });
  }

  for (
    let index = 0;
    index < requirement.msaMinimum;
    index += 1
  ) {
    slots.push({
      department: "MSA",
      slotIndex: index,
    });
  }

  for (
    let index = 0;
    index < requirement.processingMinimum;
    index += 1
  ) {
    slots.push({
      department: "Processing",
      slotIndex: index,
    });
  }

  /*
   * Locked Donor Floor composition:
   * minimum valid floor always includes at least one Phlebotomist.
   * Remaining floor positions may be Phlebotomist or DST.
   */
  if (requirement.floorMinimum > 0) {
    slots.push({
      department: "Donor Floor - Phlebotomist",
      slotIndex: 0,
    });

    for (
      let index = 1;
      index < requirement.floorMinimum;
      index += 1
    ) {
      slots.push({
        department: "Donor Floor",
        slotIndex: index,
      });
    }
  }

  for (
    let index = 0;
    index < requirement.receptionBaseline;
    index += 1
  ) {
    slots.push({
      department: "Reception",
      slotIndex: index,
    });
  }

  return slots;
}

function solveInterval(
  workers: FeasibilityWorker[],
  slots: Slot[],
) {
  const eligible = new Map<number, FeasibilityWorker[]>();

  slots.forEach((slot, index) => {
    eligible.set(
      index,
      workers.filter((worker) =>
        workerCanFill(worker, slot),
      ),
    );
  });

  /*
   * Most constrained slot first.
   * This is a small bipartite matching problem; backtracking is
   * transparent and adequate for a center-sized roster.
   */
  const orderedIndexes = slots
    .map((_, index) => index)
    .sort(
      (a, b) =>
        (eligible.get(a)?.length ?? 0) -
        (eligible.get(b)?.length ?? 0),
    );

  const used = new Set<number>();
  const chosen = new Map<number, FeasibilityWorker>();

  function search(position: number): boolean {
    if (position >= orderedIndexes.length) {
      return true;
    }

    const slotIndex = orderedIndexes[position];
    const candidates = eligible.get(slotIndex) ?? [];

    for (const worker of candidates) {
      if (used.has(worker.id)) continue;

      used.add(worker.id);
      chosen.set(slotIndex, worker);

      if (search(position + 1)) {
        return true;
      }

      chosen.delete(slotIndex);
      used.delete(worker.id);
    }

    return false;
  }

  const feasible = search(0);

  if (feasible) {
    return {
      feasible: true,
      assignments: slots.map((slot, index) => {
        const worker = chosen.get(index)!;

        return {
          department: slot.department,
          workerId: worker.id,
          workerName:
            worker.preferredName || worker.name,
        };
      }),
      unfilled: [] as Slot[],
    };
  }

  /*
   * If no perfect matching exists, greedily produce the most useful
   * diagnostic view. This does not pretend to be the final schedule.
   */
  used.clear();
  chosen.clear();

  for (const slotIndex of orderedIndexes) {
    const candidates = eligible.get(slotIndex) ?? [];

    const worker = candidates.find(
      (candidate) => !used.has(candidate.id),
    );

    if (!worker) continue;

    used.add(worker.id);
    chosen.set(slotIndex, worker);
  }

  return {
    feasible: false,
    assignments: Array.from(chosen.entries()).map(
      ([slotIndex, worker]) => ({
        department: slots[slotIndex].department,
        workerId: worker.id,
        workerName:
          worker.preferredName || worker.name,
      }),
    ),
    unfilled: slots.filter(
      (_, index) => !chosen.has(index),
    ),
  };
}

export function auditWeeklyFeasibility({
  weekStart,
  workers,
  timeOff,
  requirements,
}: {
  weekStart: Date;
  workers: FeasibilityWorker[];
  timeOff: TimeOffForFeasibility[];
  requirements: IntervalRequirement[];
}): WeeklyFeasibilitySummary {
  const activeWorkers = workers.filter(
    (worker) => worker.active,
  );

  const intervals = requirements.map((requirement) => {
    const date = dateForDayOfWeek(
      weekStart,
      requirement.dayOfWeek,
    );

    const unavailable = activeWorkers.filter((worker) =>
      onTimeOff(worker.id, date, timeOff),
    );

    const unavailableIds = new Set(
      unavailable.map((worker) => worker.id),
    );

    const availableWorkers = activeWorkers.filter(
      (worker) => !unavailableIds.has(worker.id),
    );

    const slots = buildSlots(requirement);

    const solved = solveInterval(
      availableWorkers,
      slots,
    );

    return {
      dayOfWeek: requirement.dayOfWeek,
      dayName: requirement.dayName,
      time: requirement.time,
      minuteOfDay: requirement.minuteOfDay,
      requiredSlots: slots.length,
      feasible: solved.feasible,
      assignments: solved.assignments,
      unfilled: solved.unfilled,
      unavailableWorkerIds: Array.from(
        unavailableIds,
      ),
    };
  });

  const requiredCoverageHours =
    intervals.reduce(
      (total, interval) =>
        total + interval.requiredSlots * 0.5,
      0,
    );

  const profiledWorkers = activeWorkers.filter(
    (worker) => worker.employmentProfile,
  );

  const unprofiledWorkers = activeWorkers.filter(
    (worker) => !worker.employmentProfile,
  );

  const rosterMinimumPaidHours =
    profiledWorkers.reduce(
      (total, worker) =>
        total +
        (worker.employmentProfile
          ?.minPaidWeeklyHours ?? 0),
      0,
    );

  const rosterTargetPaidHours =
    profiledWorkers.reduce(
      (total, worker) =>
        total +
        (worker.employmentProfile
          ?.targetPaidWeeklyHours ?? 0),
      0,
    );

  const rosterMaximumPaidHours =
    profiledWorkers.reduce(
      (total, worker) =>
        total +
        (worker.employmentProfile
          ?.maxPaidWeeklyHours ?? 0),
      0,
    );

  return {
    intervals,
    failedIntervals: intervals.filter(
      (interval) => !interval.feasible,
    ),
    requiredCoverageHours,
    rosterMinimumPaidHours,
    rosterTargetPaidHours,
    rosterMaximumPaidHours,
    unprofiledWorkers,
    maxHoursFeasible:
      requiredCoverageHours <=
      rosterMaximumPaidHours,
  };
}
