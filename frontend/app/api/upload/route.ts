import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const assetType = isVideo ? "file" : "image" as const;

    console.log("Uploading to Sanity:", file.name, file.type, assetType);

    const asset = await client.assets.upload(assetType, file, {
      filename: file.name,
    });

    console.log("Sanity asset created:", asset._id, asset.url);

    return NextResponse.json({
      assetId: asset._id,
      url: asset.url,
      type: isVideo ? "video" : "image",
      width: (asset as any).metadata?.dimensions?.width || null,
      height: (asset as any).metadata?.dimensions?.height || null,
    });
  } catch (err: any) {
    console.error("Sanity upload error:", err.message, err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}