import AdminShell from "../../../components/AdminShell";

import EmfImportClient from "./EmfImportClient";

export const dynamic =
  "force-dynamic";

export default function EmfImportPage() {
  return (
    <AdminShell
      pageTitle="EMF Import"
      pageDescription="Import CSL Quality EMF reports, verify employee matching, and update Worker Bee monthly quality totals."
      activePath="/settings/workers/emf"
    >
      <EmfImportClient />
    </AdminShell>
  );
}