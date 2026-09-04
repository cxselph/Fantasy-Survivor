const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

export type ResolvedImage = { url: string | null | undefined; error?: string };

/**
 * Resolves an image from a form submission that offers both a file upload and a
 * URL text field. A file upload takes priority over the URL text.
 *
 * Returns `url: null` when neither a file nor URL text was given (caller decides
 * whether that means "clear it" or "leave unchanged"). Returns `url: undefined`
 * with an `error` if a file was given but isn't a usable image.
 */
export async function resolveUploadedImage(
  formData: FormData,
  fileField: string,
  urlField: string,
): Promise<ResolvedImage> {
  const file = formData.get(fileField);
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { url: undefined, error: "File must be an image." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { url: undefined, error: "Image file is too large (max 4MB)." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return { url: `data:${file.type};base64,${buffer.toString("base64")}` };
  }

  const urlText = String(formData.get(urlField) || "").trim();
  return { url: urlText || null };
}
