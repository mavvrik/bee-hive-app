import { requireAdmin } from "@/lib/admin-auth";

import AdminShell from "@/app/settings/components/AdminShell";

import ScheduleUploadForm from "./ScheduleUploadForm";

export const dynamic =
  "force-dynamic";

export default async function WeeklySchedulePage() {
  await requireAdmin();

  return (
    <AdminShell
      pageTitle="Weekly Staff Schedule"
      pageDescription="Upload the CSL Employee Schedule - Weekly report so the HIVE can identify who is scheduled to work and when."
      activePath="/settings/weekly-schedule"
    >
      <ScheduleUploadForm />
    </AdminShell>
  );
}