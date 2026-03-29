import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366F1, #818CF8)",
          borderRadius: 40,
        }}
      >
        <svg
          width="100"
          height="100"
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
    ),
    { ...size }
  );
}
