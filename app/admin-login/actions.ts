"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function loginAdmin(
  formData: FormData,
) {
  if (!isAdminConfigured()) {
    redirect(
      "/admin-login?error=configuration",
    );
  }

  const password =
    formData.get("password");

  if (
    typeof password !== "string" ||
    !verifyAdminPassword(password)
  ) {
    redirect(
      "/admin-login?error=invalid",
    );
  }

  await createAdminSession();
  redirect("/settings");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/");
}
