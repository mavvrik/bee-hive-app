"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateMonthlyBudget(formData: FormData) {
  const budgetId = Number(formData.get("budgetId"));
  const budgetLiters = Number(formData.get("budgetLiters"));

  if (!Number.isInteger(budgetId) || budgetId <= 0) {
    throw new Error("Invalid budget ID.");
  }

  if (!Number.isFinite(budgetLiters) || budgetLiters < 0) {
    throw new Error("Budget liters must be a valid number.");
  }

  await prisma.monthlyBudget.update({
    where: {
      id: budgetId,
    },
    data: {
      budgetLiters,
    },
  });

  revalidatePath("/");
  revalidatePath("/budget");
}