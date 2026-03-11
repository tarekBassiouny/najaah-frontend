import { ImageResponse } from "next/og";

export const alt = "Najaah white-label LMS platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const OG_TITLE = "White-Label LMS for Educational Centers";
const OG_SUBTITLE =
  "AI quizzes, DRM-protected content, Arabic RTL support, and multi-tenant administration.";
const OG_FEATURES = [
  "AI Quiz Generator",
  "DRM Protection",
  "Arabic RTL",
] as const;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px",
        background:
          "linear-gradient(135deg, #0f2e25 0%, #1b4d3e 60%, #f0a500 140%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "#ffffff",
            color: "#1b4d3e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            fontWeight: 800,
          }}
        >
          N
        </div>
        <div style={{ fontSize: "38px", fontWeight: 700 }}>Najaah</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        <div
          style={{
            fontSize: "64px",
            lineHeight: 1.08,
            fontWeight: 800,
            whiteSpace: "pre-wrap",
          }}
        >
          {OG_TITLE.replace(" for ", " for\n")}
        </div>
        <div style={{ fontSize: "28px", lineHeight: 1.4, opacity: 0.92 }}>
          {OG_SUBTITLE}
        </div>
      </div>

      <div style={{ display: "flex", gap: "18px", fontSize: "24px" }}>
        {OG_FEATURES.map((feature) => (
          <div key={feature}>{feature}</div>
        ))}
      </div>
    </div>,
    size,
  );
}
