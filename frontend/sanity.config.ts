import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

export default defineConfig({
  name: "threadit",
  title: "ThreadIt Media",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  plugins: [structureTool()],
  schema: {
    types: [
      {
        name: "threadMedia",
        title: "Thread Media",
        type: "document",
        fields: [
          { name: "media", title: "Media File", type: "image", options: { hotspot: true } },
          { name: "video", title: "Video File", type: "file", options: { accept: "video/*" } },
          { name: "caption", title: "Caption", type: "string" },
          { name: "mediaType", title: "Media Type", type: "string" },
          { name: "threadId", title: "Thread ID", type: "string" },
          { name: "uploadedAt", title: "Uploaded At", type: "datetime" },
        ],
      },
    ],
  },
});