import { requireAdmin } from "@/lib/admin-auth";

export default async function BudgetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return children;
}
