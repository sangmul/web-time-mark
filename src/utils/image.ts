// Accept any common image format. Browsers cannot decode HEIC/HEIF (iPhone)
// natively, so those are converted to JPEG; everything else is verified to be
// decodable so the rest of the pipeline always gets a usable image.
export const IMAGE_ACCEPT =
  "image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tif,.tiff,.heic,.heif";

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function canDecode(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export async function normalizeImageFile(file: File): Promise<File> {
  let source: Blob = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    source = Array.isArray(converted) ? converted[0] : converted;
  }
  const url = URL.createObjectURL(source);
  const ok = await canDecode(url);
  URL.revokeObjectURL(url);
  if (!ok) throw new Error(`Format foto tidak didukung: ${file.name}`);
  const name = isHeic(file)
    ? file.name.replace(/\.hei[cf]$/i, ".jpg")
    : file.name;
  return new File([source], name, { type: source.type || file.type });
}
