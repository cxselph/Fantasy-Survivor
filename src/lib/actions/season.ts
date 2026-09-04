"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error?: string };

function refresh() {
  revalidatePath("/");
  revalidatePath("/cast");
  revalidatePath("/rules");
  revalidatePath("/join");
  revalidatePath("/admin");
  revalidatePath("/admin/seasons");
  revalidatePath("/admin/cast");
  revalidatePath("/admin/scoring");
}

export async function createSeason(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const number = Number(formData.get("number"));
  const name = String(formData.get("name") || "").trim();

  if (!Number.isInteger(number) || number < 1) {
    return { error: "Enter a valid season number." };
  }
  if (!name) {
    return { error: "Enter a season name." };
  }

  try {
    // New seasons start inactive - the commissioner activates one explicitly
    // when it's time, so nothing switches over mid-setup by accident.
    await prisma.season.create({ data: { number, name, isActive: false } });
  } catch {
    return { error: `Season ${number} already exists.` };
  }

  refresh();
  return {};
}

export async function activateSeason(seasonId: number) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.season.updateMany({ data: { isActive: false }, where: {} }),
    prisma.season.update({ where: { id: seasonId }, data: { isActive: true } }),
  ]);
  refresh();
}
