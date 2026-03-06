import { ImageResponse } from "next/og";
import {
  DEFAULT_SOCIAL_IMAGE_ALT,
  HOME_PAGE_DESCRIPTION,
  PUBLIC_SITE_DOMAIN_LABEL,
  PUBLIC_SITE_NAME
} from "@/lib/seo/public-site";

export const alt = DEFAULT_SOCIAL_IMAGE_ALT;
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "56px",
          background:
            "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 36%), linear-gradient(135deg, #f6f2ea 0%, #efe7da 45%, #e4d6c0 100%)",
          color: "#15120f",
          fontFamily: "sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: "1px solid rgba(21, 18, 15, 0.12)",
            borderRadius: "28px",
            padding: "48px",
            background: "rgba(255, 255, 255, 0.55)"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              maxWidth: "820px"
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(21, 18, 15, 0.7)"
              }}
            >
              {PUBLIC_SITE_DOMAIN_LABEL}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.04em"
              }}
            >
              {PUBLIC_SITE_NAME}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.35,
                color: "rgba(21, 18, 15, 0.82)"
              }}
            >
              {HOME_PAGE_DESCRIPTION}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: 26,
              color: "rgba(21, 18, 15, 0.72)"
            }}
          >
            <div
              style={{
                display: "flex",
                width: "64px",
                height: "2px",
                background: "rgba(184, 92, 56, 0.8)"
              }}
            />
            <div style={{ display: "flex" }}>
              Portfolio, resume, and writing on software systems.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
