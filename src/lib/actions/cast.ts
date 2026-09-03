"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getActiveSeason } from "@/lib/scoring";

function refresh() {
  revalidatePath("/cast");
  revalidatePath("/");
  revalidatePath("/admin/cast");
}

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * A file upload takes priority over the URL text field. Returns `error` if the
 * uploaded file isn't a usable image, in which case `photoUrl` is left untouched.
 */
async function resolvePhotoUrl(
  formData: FormData,
): Promise<{ photoUrl: string | null | undefined; error?: string }> {
  const file = formData.get("photoFile");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { photoUrl: undefined, error: "Photo file must be an image." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { photoUrl: undefined, error: "Photo file is too large (max 4MB)." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return { photoUrl: `data:${file.type};base64,${buffer.toString("base64")}` };
  }

  const photoUrlText = String(formData.get("photoUrl") || "").trim();
  return { photoUrl: photoUrlText || null };
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
