"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";
import { resolveUploadedImage } from "@/lib/upload";

function refresh() {
  revalidatePath("/cast");
  revalidatePath("/");
  revalidatePath("/admin/cast");
}

/**
 * A file upload takes priority over the URL text field. Returns `error` if the
 * uploaded file isn't a usable image. Leaving both blank clears the photo.
 */
async function resolvePhotoUrl(
  formData: FormData,
): Promise<{ photoUrl: string | null | undefined; error?: string }> {
  const { url, error } = await resolveUploadedImage(formData, "photoFile", "photoUrl");
  return { photoUrl: url, error };
}

export async function setEliminated(castawayId: number, isEliminated: boolean, week: number | null) {
  await requireAdmin();
  await prisma.castaway.update({
    where: { id: castawayId },
    data: {
      isEliminated,
      eliminatedWeek: isEliminated ? week : null,
    },
  });
  refresh();
}

export async function setCastawayTribe(castawayId: number, tribeId: number | null) {
  await requireAdmin();
  await prisma.castaway.update({
    where: { id: castawayId },
    data: { tribeId },
  });
  refresh();
}

export type FormState = { error?: string };

export async function createTribe(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#6b7280");
  if (!name) return { error: "Tribe name is required." };

  const season = await getActiveSeason();
  try {
    await prisma.tribe.create({ data: { seasonId: season.id, name, color } });
  } catch {
    return { error: `A tribe named "${name}" already exists.` };
  }
  refresh();
  return {};
}

export async function updateTribe(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const tribeId = Number(formData.get("tribeId"));
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#6b7280");
  if (!name) return { error: "Tribe name is required." };

  try {
    await prisma.tribe.update({ where: { id: tribeId }, data: { name, color } });
  } catch {
    return { error: `A tribe named "${name}" already exists.` };
  }
  refresh();
  return {};
}

export async function deleteTribe(formData: FormData) {
  await requireAdmin();
  const tribeId = Number(formData.get("tribeId"));
  await prisma.tribe.delete({ where: { id: tribeId } });
  refresh();
}

export async function updateCastaway(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const castawayId = Number(formData.get("castawayId"));
  const name = String(formData.get("name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name) return { error: "Name is required." };

  const { photoUrl, error } = await resolvePhotoUrl(formData);
  if (error) return { error };

  await prisma.castaway.update({
    where: { id: castawayId },
    data: {
      name,
      bio: bio || null,
      photoUrl,
      sortOrder,
    },
  });
  refresh();
  return {};
}

export async function createCastaway(
  _prevState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  if (!name) return { error: "Name is required." };

  const { photoUrl, error } = await resolvePhotoUrl(formData);
  if (error) return { error };

  const season = await getActiveSeason();
  const count = await prisma.castaway.count({ where: { seasonId: season.id } });

  try {
    await prisma.castaway.create({
      data: { seasonId: season.id, name, bio: bio || null, photoUrl: photoUrl || null, sortOrder: count },
    });
  } catch {
    return { error: `"${name}" is already in the cast.` };
  }
  refresh();
  return {};
}
