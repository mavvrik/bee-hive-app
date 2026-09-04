import rawPolicy from "@/app/config/scheduling-intelligence.json";

export type SchedulingRole =
  | "Leadership"
  | "Reception"
  | "Donor Floor"
  | "MSA"
  | "Processing";

export const schedulingPolicy = rawPolicy;

export function isWeekend(dayOfWeek: number) {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function doorOpenMinute(dayOfWeek: number) {
  return isWeekend(dayOfWeek)
    ? schedulingPolicy.centerOperatingHours.weekend.doorOpenMinute
    : schedulingPolicy.centerOperatingHours.weekday.doorOpenMinute;
}

export function doorCloseMinute(dayOfWeek: number) {
  return isWeekend(dayOfWeek)
    ? schedulingPolicy.centerOperatingHours.weekend.doorCloseMinute
    : schedulingPolicy.centerOperatingHours.weekday.doorCloseMinute;
}

export function roleOpenMinute(
  dayOfWeek: number,
  role: SchedulingRole,
) {
  return (
    doorOpenMinute(dayOfWeek) -
    schedulingPolicy.roleOpenOffsetsMinutes[role]
  );
}
