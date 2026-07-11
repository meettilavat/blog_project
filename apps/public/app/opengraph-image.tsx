import { ImageResponse } from "next/og";
import {
  DEFAULT_SOCIAL_IMAGE_ALT,
  HOME_PAGE_DESCRIPTION,
  PUBLIC_SITE_DOMAIN_LABEL,
  PUBLIC_SITE_NAME
} from "@/lib/seo/public-site";

export const alt = DEFAULT_SOCIAL_IMAGE_ALT;
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "52px 58px",
          backgroundColor: "#15120f",
          backgroundImage:
            "linear-gradient(rgba(244,234,216,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(244,234,216,0.035) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "#f4ead8"
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            borderTop: "1px solid #6f5a47",
            borderBottom: "1px solid #6f5a47"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 0 18px",
              borderBottom: "1px solid rgba(111,90,71,0.72)",
              fontFamily: "monospace",
              fontSize: 17,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#c9b59b"
            }}
          >
            <div style={{ display: "flex" }}>{PUBLIC_SITE_DOMAIN_LABEL}</div>
            <div style={{ display: "flex" }}>Field journal / 2026</div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "56px",
              padding: "38px 0 36px"
            }}
          >
            <div style={{ display: "flex", maxWidth: "760px", flexDirection: "column", gap: "22px" }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Georgia, serif",
                  fontSize: 82,
                  fontWeight: 600,
                  lineHeight: 0.96,
                  letterSpacing: "-0.045em"
                }}
              >
                {PUBLIC_SITE_NAME}
              </div>
              <div
                style={{
                  display: "flex",
                  maxWidth: "720px",
                  fontSize: 27,
                  lineHeight: 1.35,
                  color: "#d8c7ad"
                }}
              >
                {HOME_PAGE_DESCRIPTION}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                width: "182px",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "12px",
                paddingLeft: "24px",
                borderLeft: "1px solid #6f5a47",
                fontFamily: "monospace",
                fontSize: 15,
                lineHeight: 1.5,
                letterSpacing: "0.12em",
                textAlign: "right",
                textTransform: "uppercase",
                color: "#e59a72"
              }}
            >
              <div style={{ display: "flex" }}>Issue 01</div>
              <div style={{ display: "flex", color: "#c9b59b" }}>Systems / infrastructure / experiments</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
