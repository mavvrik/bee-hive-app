export type EmploymentProfileLike = {
  employmentType: "FTE" | "PTE" | string;
  schedulePattern: "STANDARD_8" | "FOUR_TENS" | string;
  minPaidWeeklyHours: number;
  maxPaidWeeklyHours: number;
  targetPaidWeeklyHours: number;
  scheduledShiftHours: number;
  unpaidLunchMinutes: number;
};

export function paidHoursPerShift(profile: EmploymentProfileLike) {
  return Math.max(
    0,
    profile.scheduledShiftHours - profile.unpaidLunchMinutes / 60,
  );
}

export function defaultWorkDays(profile: EmploymentProfileLike) {
  return profile.schedulePattern === "FOUR_TENS" ? 4 : 5;
}

export function projectedWeeklyPaidHours(profile: EmploymentProfileLike) {
  return paidHoursPerShift(profile) * defaultWorkDays(profile);
}

export function auditWeeklyHours(profile: EmploymentProfileLike) {
  const projected = projectedWeeklyPaidHours(profile);

  return {
    paidHoursPerShift: paidHoursPerShift(profile),
    projectedWeeklyPaidHours: projected,
    meetsMinimum: projected >= profile.minPaidWeeklyHours,
    withinMaximum: projected <= profile.maxPaidWeeklyHours,
    targetDifference: profile.targetPaidWeeklyHours - projected,
    isValid:
      projected >= profile.minPaidWeeklyHours &&
      projected <= profile.maxPaidWeeklyHours,
  };
}
