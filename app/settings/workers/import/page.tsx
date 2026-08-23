import Link from "next/link";

import {
  requireAdmin,
} from "@/lib/admin-auth";

import AdminShell from "@/app/settings/components/AdminShell";

import TaskImportClient from "./TaskImportClient";

export const dynamic =
  "force-dynamic";

export default async function WorkerTaskImportPage() {
  await requireAdmin();

  return (
    <AdminShell
      pageTitle="Worker Task Import"
      pageDescription="Import CSL Tasks Completed by Employee reports into the HIVE with worker, date, role, and task validation before any data is committed."
      activePath="/settings/workers/import"
    >
      <div
        style={{
          marginBottom:
            18,
        }}
      >
        <Link
          href="/settings/workers"
          style={{
            color:
              "#805c0b",

            fontWeight:
              800,

            textDecoration:
              "none",
          }}
        >
          ← Return to Worker Bees
        </Link>
      </div>

      <TaskImportClient />
    </AdminShell>
  );
}