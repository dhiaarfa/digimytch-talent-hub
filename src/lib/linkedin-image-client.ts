/** Resize screenshot before upload to reduce 429s and speed up vision/OCR. */
export async function prepareLinkedInScreenshot(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  const maxWidth = 1200;
  const maxHeight = 1600;

  if (typeof createImageBitmap === "undefined") {
    return readFileAsBase64(file);
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readFileAsBase64(file);

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) return readFileAsBase64(file);

    const base64 = await blobToBase64(blob);
    return { base64, mimeType: "image/jpeg" };
  } catch {
    return readFileAsBase64(file);
  }
}

async function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header?.match(/data:(image\/[^;]+)/);
  return {
    base64: base64 ?? "",
    mimeType: mimeMatch?.[1] ?? (file.type || "image/jpeg"),
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
