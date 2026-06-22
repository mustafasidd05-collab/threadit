export interface UploadedAsset {
  assetId: string;
  url: string;
  type: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
}

export async function uploadToSanity(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append("file", file);

  onProgress?.(20);

  let res: Response;
  try {
    res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  } catch (e: any) {
    throw new Error(
      "Network error: " + (e.message || "Could not reach upload server")
    );
  }

  onProgress?.(80);

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server returned invalid response");
  }

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : JSON.stringify(data)
    );
  }

  onProgress?.(100);
  return data as UploadedAsset;
}