import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Phos AI — AI 기반 이미지 보정, 편집, 생성";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #090A14 0%, #10112A 50%, #090A14 100%)",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 24,
            background: "linear-gradient(135deg, #6366F1, #818CF8)",
            marginBottom: 32,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 20 20"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m10 2.5-1.593 4.844a1.667 1.667 0 0 1-1.063 1.063L2.5 10l4.844 1.593a1.667 1.667 0 0 1 1.063 1.063L10 17.5l1.593-4.844a1.667 1.667 0 0 1 1.063-1.063L17.5 10l-4.844-1.593a1.667 1.667 0 0 1-1.063-1.063L10 2.5Z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 100%)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
          }}
        >
          Phos AI
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#94A3B8",
            fontWeight: 500,
          }}
        >
          AI 기반 이미지 보정 · 편집 · 생성
        </div>

        {/* Domain */}
        <div
          style={{
            display: "flex",
            fontSize: 18,
            color: "#6366F1",
            fontWeight: 600,
            marginTop: 24,
            letterSpacing: "0.05em",
          }}
        >
          phos.studio
        </div>
      </div>
    ),
    { ...size }
  );
}
