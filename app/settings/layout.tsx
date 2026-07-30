import { requireAdmin } from "@/lib/admin-auth";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return children;
}
