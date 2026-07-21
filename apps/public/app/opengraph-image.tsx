import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DEFAULT_SOCIAL_IMAGE_ALT,
  HOME_PAGE_DESCRIPTION,
  PUBLIC_SITE_DOMAIN_LABEL,
  PUBLIC_SITE_NAME
} from "@/lib/seo/public-site";

export const alt = DEFAULT_SOCIAL_IMAGE_ALT;
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

async function loadFont(file: string): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(join(process.cwd(), "apps/public/app/fonts", file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [grotesk, mono] = await Promise.all([
    loadFont("SpaceGrotesk-Bold.ttf"),
    loadFont("IBMPlexMono-Regular.ttf")
  ]);
  const fonts = [
    grotesk ? { name: "Space Grotesk", data: grotesk, style: "normal" as const, weight: 700 as const } : null,
    mono ? { name: "IBM Plex Mono", data: mono, style: "normal" as const, weight: 400 as const } : null
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  // next/og (satori) requires at least one font: passing `fonts: []` throws
  // "No fonts are loaded". When the branded TTFs aren't vendored, omit the
  // option entirely so next/og falls back to its bundled default font.
  const imageOptions = fonts.length > 0 ? { ...size, fonts } : size;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", padding: "56px 60px", backgroundColor: "#0B0D10", color: "#E8EAEE", fontFamily: grotesk ? "Space Grotesk" : "sans-serif" }}>
        <div style={{ display: "flex", width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: mono ? "IBM Plex Mono" : "monospace", fontSize: 18, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9BA3AF" }}>
            <div>{PUBLIC_SITE_DOMAIN_LABEL}</div>
            <div style={{ color: "#F2A93B" }}>meettilavat.com</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ width: 64, height: 3, backgroundColor: "#F2A93B" }} />
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", maxWidth: 900 }}>{PUBLIC_SITE_NAME}</div>
            <div style={{ fontSize: 28, lineHeight: 1.35, color: "#9BA3AF", maxWidth: 760 }}>{HOME_PAGE_DESCRIPTION}</div>
          </div>
        </div>
      </div>
    ),
    imageOptions
  );
}
