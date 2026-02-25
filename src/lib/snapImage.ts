const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function normalizeMimeType(mimeType: string | null | undefined): string {
  return (mimeType ?? "").trim().toLowerCase();
}

function extractExtensionFromFilename(filename: string | null | undefined): string | null {
  const name = (filename ?? "").trim().toLowerCase();
  if (name.length === 0) {
    return null;
  }

  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1 || lastDot === name.length - 1) {
    return null;
  }

  const ext = name.slice(lastDot + 1);
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(ext)) {
    return null;
  }

  return ext;
}

export function resolveSnapImageExtension(
  filename: string | null | undefined,
  mimeType: string | null | undefined,
): string {
  const fromFilename = extractExtensionFromFilename(filename);
  if (fromFilename) {
    return fromFilename;
  }

  const fromMime = MIME_EXTENSION_MAP[normalizeMimeType(mimeType)];
  if (fromMime) {
    return fromMime;
  }

  return "jpg";
}

export function buildSnapPreviewFilename(
  filename: string | null | undefined,
  mimeType: string | null | undefined,
): string {
  const extension = resolveSnapImageExtension(filename, mimeType);
  return `home-preview.${extension}`;
}
