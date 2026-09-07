import { NextResponse } from "next/server";

import { getTodayPowerHours } from "@/app/lib/power-hour/powerHourToday";
import { powerHourAlertPolicy } from "@/app/lib/power-hour/powerHourAlertPolicy";

export const dynamic = "force-dynamic";

export async function GET() {
  const local = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  );

  return NextResponse.json({
    timeZone: "America/New_York",
    policy: powerHourAlertPolicy,
    powerHours: await getTodayPowerHours(local.getDay()),
  });
}
