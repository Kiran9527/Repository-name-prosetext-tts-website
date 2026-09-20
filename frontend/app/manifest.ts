import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProseText — AI Text to Speech",
    short_name: "ProseText",
    description:
      "Convert text into natural-sounding AI speech and download MP3 audio.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    orientation: "portrait",
    lang: "en",
    categories: ["productivity", "utilities", "entertainment"],
  };
}