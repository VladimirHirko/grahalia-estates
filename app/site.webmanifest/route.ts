import { NextResponse } from "next/server";

export function GET() {
  const manifest = {
    name: "Grahalia Estates",
    short_name: "Grahalia",
    start_url: "/en",
    display: "standalone",
    background_color: "#fcf8f2",
    theme_color: "#2B4537",
    icons: [
      { src: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
